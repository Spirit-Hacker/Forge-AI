import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import { db } from "@forge/db";

import { storage } from "../storage/index.js";
import { validateProjectPath } from "../files/file-path.js";
import { getWorkspace } from "./workspace.manager.js";
import { projectFileVersionObjectKey } from "../storage/object-key.js";
import { normalizeTextContent } from "./file-content.js";

function calculateSha256(content: Buffer) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

function getSafeWorkspacePath(workspacePath: string, filePath: string) {
  validateProjectPath(filePath);

  const resolvedWorkspace = path.resolve(workspacePath);

  const resolvedFile = path.resolve(workspacePath, filePath);

  if (
    resolvedFile !== resolvedWorkspace &&
    !resolvedFile.startsWith(`${resolvedWorkspace}${path.sep}`)
  ) {
    throw new Error("Invalid workspace file path");
  }

  return resolvedFile;
}

export async function syncWorkspaceFile(
  userId: string,
  projectId: string,
  filePath: string,
) {
  const workspacePath = await getWorkspace(userId, projectId);
  const path = validateProjectPath(filePath);

  const safePath = getSafeWorkspacePath(workspacePath, path);

  const rawContent = await fs.readFile(safePath);

  const content = normalizeTextContent(rawContent);

  const sha256 = calculateSha256(content);

  console.log(`[workspace-sync] Syncing file: ${projectId}/${filePath}`);
  console.log(`[workspace-sync] Syncing file path: ${projectId}/${path}`);
  // console.log("Content: ", content.toString("utf8"));

  const file = await db.projectFile.findFirst({
    where: {
      projectId,
      path,
      project: {
        userId,
      },
    },
    include: {
      currentVersion: true,
    },
  });

  // console.log("File: ", file);

  /*
   * File doesn't exist in Forge yet.
   *
   * This can happen when a terminal command or
   * future AI agent creates a new file.
   */
  if (!file) {
    console.log(
      `[workspace-sync] File doesn't exist in Forge yet. Creating file: ${projectId}/${path}`,
    );
    const fileId = crypto.randomUUID();
    let objectKey = projectFileVersionObjectKey(projectId, fileId, 1);
    const createdFile = await db.projectFile.create({
      data: {
        projectId,
        path,
        objectKey,
        size: content.length,
        sha256,
      },
    });

    objectKey = projectFileVersionObjectKey(projectId, createdFile.id, 1);

    await storage.put(objectKey, content);

    const version = await db.fileVersion.create({
      data: {
        fileId: createdFile.id,
        version: 1,
        objectKey,
        size: content.length,
        sha256,
      },
    });

    const updatedFile = await db.projectFile.update({
      where: {
        id: createdFile.id,
      },
      data: {
        objectKey,
        currentVersionId: version.id,
      },
      include: {
        currentVersion: true,
      },
    });

    return updatedFile;
  }

  console.log(
    `[workspace-sync] File exists in Forge. Updating file: ${projectId}/${path}`,
  );

  /*
   * If the filesystem content is identical to the
   * current Forge version, nothing needs to happen.
   */
  if (file.currentVersion && file.currentVersion.sha256 === sha256) {
    return file;
  }

  const nextVersion = file.currentVersion ? file.currentVersion.version + 1 : 1;

  const objectKey = projectFileVersionObjectKey(
    projectId,
    file.id,
    nextVersion,
  );

  await storage.put(objectKey, content);

  const version = await db.fileVersion.create({
    data: {
      fileId: file.id,
      version: nextVersion,
      objectKey,
      size: content.length,
      sha256,
    },
  });

  const updatedFile = await db.projectFile.update({
    where: {
      id: file.id,
    },
    data: {
      objectKey,
      size: content.length,
      sha256,
      currentVersionId: version.id,
    },
    include: {
      currentVersion: true,
    },
  });

  return updatedFile;
}

export async function deleteWorkspaceFileFromForge(
  userId: string,
  projectId: string,
  filePath: string,
) {
  console.log("[workspace-sync] path deleting: ", filePath);
  const path = validateProjectPath(filePath);
  const file = await db.projectFile.findFirst({
    where: {
      projectId,
      path,
      project: {
        userId,
      },
    },
    include: {
      versions: {
        select: {
          objectKey: true,
        },
      },
    },
  });

  console.log(`[workspace-sync] Deleting file: ${projectId}/${path}`);
  console.log("File: ", file);

  // The file may already have been deleted.
  if (!file) {
    return;
  }

  for (const version of file.versions) {
    try {
      await storage.delete(version.objectKey);
    } catch (error) {
      console.error(
        `[workspace-sync] Failed to delete S3 object ${version.objectKey}`,
        error,
      );
    }
  }

  await db.projectFile.delete({
    where: {
      id: file.id,
    },
  });
}
