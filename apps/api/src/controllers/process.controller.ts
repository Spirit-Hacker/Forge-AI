import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "@forge/db";

import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { AppError } from "../errors/app-error.js";
import { workspaceSessionManager } from "../workspace/workspace-session.manager.js";
import { executionManager } from "../execution/execution-manager.js";
import { processManager } from "../execution/process-manager.js";

const startProcessSchema = z.object({
  command: z.string().trim().min(1).max(4096),
});

async function authorizeProject(req: Request, projectId: string) {
  const userId = (req as AuthenticatedRequest).user.id;

  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    select: {
      id: true,
    },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  return userId;
}

function getRouteParam(value: string | string[] | undefined): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new AppError(400, "Invalid route parameter");
  }

  return value;
}

export async function startProcessController(req: Request, res: Response) {
  const projectId = getRouteParam(req.params.projectId);
  const userId = await authorizeProject(req, projectId);

  const { command } = startProcessSchema.parse(req.body);

  const session = await workspaceSessionManager.getOrCreate(userId, projectId);

  await executionManager.getOrCreate(projectId, session.workspacePath);

  const process = await processManager.start(projectId, command);

  res.status(201).json(process);
}

export async function getProjectProcessesController(
  req: Request,
  res: Response,
) {
  const projectId = getRouteParam(req.params.projectId);

  await authorizeProject(req, projectId);

  res.json(processManager.getProjectProcesses(projectId));
}

export async function getProcessController(req: Request, res: Response) {
  const projectId = getRouteParam(req.params.projectId);
  const processId = getRouteParam(req.params.processId);

  await authorizeProject(req, projectId);

  const process = processManager.get(projectId, processId);

  if (!process) {
    throw new AppError(404, "Process not found");
  }

  res.json(process);
}

export async function stopProcessController(req: Request, res: Response) {
  const projectId = getRouteParam(req.params.projectId);
  const processId = getRouteParam(req.params.processId);

  await authorizeProject(req, projectId);

  const stopped = await processManager.stop(projectId, processId);

  if (!stopped) {
    throw new AppError(404, "Process not found or already stopped");
  }

  res.json({
    success: true,
    processId,
  });
}
