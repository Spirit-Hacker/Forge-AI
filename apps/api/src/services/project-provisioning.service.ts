import { db } from "@forge/db";

import { getWorkspace } from "../workspace/workspace.manager.js";
import { workspaceSessionManager } from "../workspace/workspace-session.manager.js";

import { executionManager } from "../execution/execution-manager.js";
import { processManager } from "../execution/process-manager.js";

import {
  INSTALLCOMMAND,
  PREVIEWCOMMAND,
} from "../execution/preview-command.js";

import { scaffoldViteReactProject } from "../scaffolding/project-scaffolder.js";

const INSTALL_TIMEOUT_MS = 10 * 60 * 1000;
const PREVIEW_TIMEOUT_MS = 60 * 1000;
const POLL_INTERVAL_MS = 1000;

const provisioningProjects = new Set<string>();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function getProcessLogs(stdout: string, stderr: string) {
  return [stdout, stderr].filter(Boolean).join("\n").slice(-4000);
}

async function updateProvisioningStatus(
  projectId: string,
  status:
    | "CREATING"
    | "PROVISIONING"
    | "INSTALLING_DEPENDENCIES"
    | "STARTING_PREVIEW"
    | "CHECKING_PREVIEW"
    | "READY"
    | "FAILED",
  message: string,
  additionalData: {
    provisioningError?: string | null;
    provisioningStartedAt?: Date;
    provisioningCompletedAt?: Date | null;
  } = {},
) {
  await db.project.update({
    where: {
      id: projectId,
    },
    data: {
      provisioningStatus: status,
      provisioningMessage: message,
      ...additionalData,
    },
  });
}

async function waitForManagedProcess(
  projectId: string,
  processId: string,
  timeoutMs: number,
) {
  const startedAt = Date.now();

  let lastPersistedLogs = "";

  while (Date.now() - startedAt < timeoutMs) {
    const process = processManager.get(projectId, processId);

    if (!process) {
      throw new Error("Managed process could not be found");
    }

    const logs = getProcessLogs(process.stdout, process.stderr);

    if (logs && logs !== lastPersistedLogs) {
      lastPersistedLogs = logs;

      await db.project.update({
        where: {
          id: projectId,
        },
        data: {
          provisioningMessage: logs,
        },
      });
    }

    if (
      process.status === "exited" ||
      process.status === "failed" ||
      process.status === "stopped"
    ) {
      if (process.exitCode !== 0 || process.status !== "exited") {
        throw new Error(
          process.stderr ||
            process.stdout ||
            `Process failed with status ${process.status}`,
        );
      }

      return process;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  // Avoid leaving a timed-out installation process running.
  try {
    await processManager.stop(projectId, processId);
  } catch (error) {
    console.error("[provisioning] Failed to stop timed-out process", error);
  }

  throw new Error(
    `Process timed out after ${Math.round(timeoutMs / 1000)} seconds`,
  );
}

async function waitForPreview(
  projectId: string,
  processId: string,
  timeoutMs: number,
) {
  const environment = executionManager.get(projectId);

  if (!environment) {
    throw new Error("Project execution environment not found");
  }

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const process = processManager.get(projectId, processId);

    if (!process) {
      throw new Error("Preview process could not be found");
    }

    if (process.status === "failed" || process.status === "exited") {
      throw new Error(
        process.stderr ||
          process.stdout ||
          "Preview server exited before becoming ready",
      );
    }

    // Check Vite from inside the project container.
    const healthCheck = await environment.exec(
      `node -e 'fetch("http://127.0.0.1:5173").then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))'`,
    );

    if (healthCheck.exitCode === 0) {
      return;
    }

    await sleep(1000);
  }

  throw new Error("Preview server did not become ready in time");
}

async function runProjectProvisioning(userId: string, projectId: string) {
  try {
    await updateProvisioningStatus(
      projectId,
      "PROVISIONING",
      "Preparing project environment...",
      {
        provisioningStartedAt: new Date(),
        provisioningCompletedAt: null,
        provisioningError: null,
      },
    );

    // 1. Create or retrieve the host workspace.
    const workspacePath = await getWorkspace(userId, projectId);

    // 2. Create the Docker execution environment.
    await executionManager.getOrCreate(projectId, workspacePath);

    // 3. Generate starter project files and sync them to S3.
    await updateProvisioningStatus(
      projectId,
      "PROVISIONING",
      "Generating starter project...",
    );

    const scaffoldResult = await scaffoldViteReactProject({
      userId,
      projectId,
    });

    console.log(
      `[provisioning] Scaffolded ${scaffoldResult.files.length} files`,
    );

    // 4. Start the workspace watcher after scaffolding.
    // It will ignore node_modules but can sync package-lock.json.
    await workspaceSessionManager.getOrCreate(userId, projectId);

    // 5. Install dependencies.
    await updateProvisioningStatus(
      projectId,
      "INSTALLING_DEPENDENCIES",
      "Installing project dependencies...",
    );

    const installProcess = await processManager.start(
      projectId,
      INSTALLCOMMAND,
    );

    await waitForManagedProcess(
      projectId,
      installProcess.id,
      INSTALL_TIMEOUT_MS,
    );

    // 6. Start Vite.
    await updateProvisioningStatus(
      projectId,
      "STARTING_PREVIEW",
      "Starting development server...",
    );

    const previewProcess = await processManager.start(
      projectId,
      PREVIEWCOMMAND,
    );

    // 7. Verify that Vite responds successfully.
    await updateProvisioningStatus(
      projectId,
      "CHECKING_PREVIEW",
      "Checking preview server...",
    );

    await waitForPreview(projectId, previewProcess.id, PREVIEW_TIMEOUT_MS);

    // 8. Mark project ready.
    await updateProvisioningStatus(projectId, "READY", "Project is ready!", {
      provisioningCompletedAt: new Date(),
      provisioningError: null,
    });

    console.log(`[provisioning] Project ${projectId} is READY`);
  } catch (error) {
    const message = getErrorMessage(error);

    console.error(`[provisioning] Project ${projectId} failed:`, error);

    try {
      await updateProvisioningStatus(
        projectId,
        "FAILED",
        "Project provisioning failed.",
        {
          provisioningError: message,
          provisioningCompletedAt: new Date(),
        },
      );
    } catch (updateError) {
      console.error(
        "[provisioning] Failed to persist failure status:",
        updateError,
      );
    }
  }
}

export async function startProjectProvisioning(
  userId: string,
  projectId: string,
): Promise<boolean> {
  if (provisioningProjects.has(projectId)) {
    return false;
  }

  provisioningProjects.add(projectId);

  try {
    const result = await db.project.updateMany({
      where: {
        id: projectId,
        userId,
      },
      data: {
        provisioningStatus: "CREATING",
        provisioningMessage: "Starting project provisioning...",
        provisioningError: null,
        provisioningStartedAt: new Date(),
        provisioningCompletedAt: null,
      },
    });

    if (result.count === 0) {
      throw new Error("Project not found");
    }

    // Run provisioning in the background.
    void runProjectProvisioning(userId, projectId).finally(() => {
      provisioningProjects.delete(projectId);
    });

    return true;
  } catch (error) {
    provisioningProjects.delete(projectId);
    throw error;
  }
}
