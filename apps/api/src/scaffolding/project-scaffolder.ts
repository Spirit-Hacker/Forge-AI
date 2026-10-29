import fs from "node:fs/promises";
import path from "node:path";

import { getWorkspace } from "../workspace/workspace.manager.js";
import { syncWorkspaceFile } from "../workspace/workspace-sync.service.js";

import { createViteReactTemplate } from "./templates/vite-react.template.js";

export interface ScaffoldProjectOptions {
  userId: string;
  projectId: string;
}

export async function scaffoldViteReactProject({
  userId,
  projectId,
}: ScaffoldProjectOptions) {
  const workspacePath = await getWorkspace(userId, projectId);

  const files = createViteReactTemplate({ projectId });

  const createdFiles: string[] = [];

  const resolvedWorkspacePath = path.resolve(workspacePath);

  for (const [relativePath, content] of Object.entries(files)) {
    const absolutePath = path.resolve(resolvedWorkspacePath, relativePath);

    // Ensure generated paths stay inside the project workspace.
    if (!absolutePath.startsWith(`${resolvedWorkspacePath}${path.sep}`)) {
      throw new Error(`Invalid scaffold path: ${relativePath}`);
    }

    // Create parent directories.
    await fs.mkdir(path.dirname(absolutePath), {
      recursive: true,
    });

    // Write the generated file.
    await fs.writeFile(absolutePath, content, "utf8");

    // Synchronize the file with PostgreSQL and S3.
    await syncWorkspaceFile(userId, projectId, relativePath);

    createdFiles.push(relativePath);
  }

  console.log(
    `[scaffolder] Created ${createdFiles.length} files for project ${projectId}`,
  );

  return {
    projectId,
    workspacePath,
    files: createdFiles,
  };
}
