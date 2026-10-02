import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { workspaceChangeCoordinator } from "./workspace-change-coordinator.js";

const WORKSPACE_ROOT = path.join(os.tmpdir(), "forge-workspaces");

function getWorkspacePath(projectId: string) {
  return path.join(WORKSPACE_ROOT, projectId);
}

function getSafeWorkspacePath(projectId: string, filePath: string) {
  const workspacePath = path.resolve(getWorkspacePath(projectId));

  if (path.isAbsolute(filePath) || /^[a-zA-Z]:/.test(filePath)) {
    throw new Error("Invalid workspace file path");
  }

  const normalized = filePath.replaceAll("\\", "/").split("/");

  if (
    normalized.some(
      (part) => !part || part === "." || part === ".." || part.includes("\0"),
    )
  ) {
    throw new Error("Invalid workspace file path");
  }

  const target = path.resolve(workspacePath, ...normalized);

  if (!target.startsWith(`${workspacePath}${path.sep}`)) {
    throw new Error("Path escapes workspace");
  }

  return target;
}

export async function writeWorkspaceFile(
  projectId: string,
  filePath: string,
  content: Buffer,
) {
  const root = path.resolve(WORKSPACE_ROOT, projectId);

  // Only mirror files into an existing workspace.
  try {
    const stat = await fs.lstat(root);

    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      throw new Error("Unsafe workspace directory");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }

  // Reject unsafe file paths.
  const parts = filePath.split(/[\\/]/);

  if (
    path.isAbsolute(filePath) ||
    /^[a-zA-Z]:/.test(filePath) ||
    parts.some(
      (part) =>
        part === "" || part === "." || part === ".." || part.includes("\0"),
    )
  ) {
    throw new Error("Invalid workspace file path");
  }

  const destination = path.resolve(root, ...parts);

  if (!destination.startsWith(root + path.sep)) {
    throw new Error("Path escapes workspace");
  }

  // Reject symlinks in existing path components.
  let current = root;

  for (const part of parts.slice(0, -1)) {
    current = path.join(current, part);

    try {
      const stat = await fs.lstat(current);

      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error("Unsafe workspace path");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }

      await fs.mkdir(current);
    }
  }

  try {
    const stat = await fs.lstat(destination);

    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("Unsafe workspace destination");
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  workspaceChangeCoordinator.suppress(projectId, filePath);

  // Write to a temporary file before replacing the target.
  const tempPath = path.join(
    path.dirname(destination),
    `.forge-${crypto.randomUUID()}.tmp`,
  );

  try {
    await fs.writeFile(tempPath, content, {
      flag: "wx",
    });

    await fs.rename(tempPath, destination);
  } finally {
    await fs.rm(tempPath, { force: true });
  }
}

export async function renameWorkspaceFile(
  projectId: string,
  oldPath: string,
  newPath: string,
) {
  const oldFilePath = getSafeWorkspacePath(projectId, oldPath);

  const newFilePath = getSafeWorkspacePath(projectId, newPath);

  try {
    await fs.lstat(oldFilePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }

  workspaceChangeCoordinator.suppress(projectId, oldPath);

  workspaceChangeCoordinator.suppress(projectId, newPath);

  await fs.mkdir(path.dirname(newFilePath), {
    recursive: true,
  });

  await fs.rename(oldFilePath, newFilePath);
}

export async function deleteWorkspaceFile(projectId: string, filePath: string) {
  const target = getSafeWorkspacePath(projectId, filePath);

  try {
    const stat = await fs.lstat(target);

    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error("Workspace target is not a regular file");
    }

    workspaceChangeCoordinator.suppress(projectId, filePath);
    await fs.unlink(target);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return;
    }

    throw error;
  }
}
