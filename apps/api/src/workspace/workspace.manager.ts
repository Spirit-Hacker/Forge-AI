import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";

import { db } from "@forge/db";
import { storage } from "../storage/index.js";
import { AppError } from "../errors/app-error.js";

const WORKSPACE_ROOT = path.join(os.tmpdir(), "forge-workspaces");

export function getWorkspacePath(projectId: string) {
  return path.join(WORKSPACE_ROOT, projectId);
}

function getSafeFilePath(workspacePath: string, filePath: string) {
  const resolvedWorkspace = path.resolve(workspacePath);
  const resolvedFile = path.resolve(workspacePath, filePath);

  if (
    resolvedFile !== resolvedWorkspace &&
    !resolvedFile.startsWith(`${resolvedWorkspace}${path.sep}`)
  ) {
    throw new AppError(400, "Invalid file path");
  }

  return resolvedFile;
}

export async function getWorkspace(userId: string, projectId: string) {
  const project = await db.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  const workspacePath = getWorkspacePath(projectId);

  await fs.mkdir(workspacePath, {
    recursive: true,
  });

  return workspacePath;
}

export async function syncProjectToWorkspace(
  userId: string,
  projectId: string,
) {
  const workspacePath = await getWorkspace(userId, projectId);

  const files = await db.projectFile.findMany({
    where: {
      projectId,
    },
    include: {
      currentVersion: true,
    },
  });

  console.log("WORKSPACE FILES: ", files);

  for (const file of files) {
    if (!file.currentVersion) {
      continue;
    }

    const content = await storage.get(file.currentVersion.objectKey);

    const filePath = getSafeFilePath(workspacePath, file.path);

    await fs.mkdir(path.dirname(filePath), {
      recursive: true,
    });

    await fs.writeFile(filePath, content);
  }

  return workspacePath;
}
