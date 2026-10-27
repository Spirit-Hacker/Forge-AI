import type { Request, Response } from "express";
import { db } from "@forge/db";

import { workspaceSessionManager } from "../workspace/workspace-session.manager.js";
import { executionManager } from "../execution/execution-manager.js";
import { processManager } from "../execution/process-manager.js";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { AppError } from "../errors/app-error.js";
import {
  PREVIEW_GATEWAY_PORT,
  PREVIEW_PORT,
  PREVIEWCOMMAND,
} from "../execution/preview-command.js";

function getPreviewUrl(projectId: string) {
  return `http://${projectId}--${PREVIEW_PORT}.localhost:${PREVIEW_GATEWAY_PORT}/`;
}

// TODO: instead use verifyProjectOwnership function and also make verifyProjectOwnership a common utility for file service and snapshot service and preview service
async function assertProjectOwnership(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }
}

function getActivePreview(projectId: string) {
  return processManager
    .getProjectProcesses(projectId)
    .find(
      (process) =>
        process.command === PREVIEWCOMMAND &&
        (process.status === "running" || process.status === "stopping"),
    );
}

export async function startPreview(req: Request, res: Response) {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;

  await assertProjectOwnership(userId, projectId as string);

  const existing = getActivePreview(projectId as string);

  if (existing) {
    res.status(200).json({
      process: existing,
      url: getPreviewUrl(projectId as string),
    });
    return;
  }

  const session = await workspaceSessionManager.getOrCreate(
    userId,
    projectId as string,
  );

  await executionManager.getOrCreate(
    projectId as string,
    session.workspacePath,
  );

  const process = await processManager.start(
    projectId as string,
    PREVIEWCOMMAND,
  );

  res.status(202).json({
    process,
    url: getPreviewUrl(projectId as string),
  });
}

export async function getPreview(req: Request, res: Response) {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;

  await assertProjectOwnership(userId, projectId as string);

  const processes = processManager.getProjectProcesses(projectId as string);
  const preview = [...processes]
    .reverse()
    .find((process) => process.command === PREVIEWCOMMAND);

  res.json({
    status: preview?.status ?? "stopped",
    process: preview ?? null,
    url: preview ? getPreviewUrl(projectId as string) : null,
  });
}

export async function stopPreview(req: Request, res: Response) {
  const { projectId } = req.params;
  const userId = (req as AuthenticatedRequest).user.id;

  await assertProjectOwnership(userId, projectId as string);

  const preview = getActivePreview(projectId as string);

  console.log("[STOPPING PREVIEW]: ", preview);

  if (!preview) {
    res.json({ status: "stopped" });
    return;
  }

  await processManager.stop(projectId as string, preview.id);

  res.json({ status: "stopped" });
}
