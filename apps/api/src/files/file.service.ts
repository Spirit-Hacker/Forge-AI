import crypto from "node:crypto";

import { db } from "@forge/db";

import { storage } from "../storage/index.js";
import { projectFileVersionObjectKey } from "../storage/object-key.js";

import { validateProjectPath } from "./file-path.js";

import type { CreateFileInput, UpdateFileInput } from "./file.schema.js";
import { AppError } from "../errors/app-error.js";

async function verifyProjectOwnership(userId: string, projectId: string) {
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
    throw new Error("Project not found");
  }

  return project;
}

async function getNextVersionNumber(fileId: string) {
  const latestVersion = await db.fileVersion.findFirst({
    where: {
      fileId,
    },
    orderBy: {
      version: "desc",
    },
    select: {
      version: true,
    },
  });

  return latestVersion ? latestVersion.version + 1 : 1;
}

function calculateSha256(content: Buffer) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

export async function createFile(
  userId: string,
  projectId: string,
  input: CreateFileInput,
) {
  await verifyProjectOwnership(userId, projectId);

  const path = validateProjectPath(input.path);

  const existingFile = await db.projectFile.findUnique({
    where: {
      projectId_path: {
        projectId,
        path,
      },
    },
  });

  if (existingFile) {
    throw new Error("File already exists");
  }

  const content = Buffer.from(input.content, "utf8");

  const sha256 = calculateSha256(content);

  const file = await db.projectFile.create({
    data: {
      projectId,
      path,
      objectKey: "",
      size: content.length,
      contentType: input.contentType ?? "text/plain",
      sha256,
    },
  });

  const version = 1;

  const objectKey = projectFileVersionObjectKey(projectId, file.id, version);

  try {
    await storage.put(objectKey, content, input.contentType ?? "text/plain");

    const fileVersion = await db.fileVersion.create({
      data: {
        fileId: file.id,
        version,
        objectKey,
        size: content.length,
        contentType: input.contentType ?? "text/plain",
        sha256,
      },
    });

    return await db.projectFile.update({
      where: {
        id: file.id,
      },
      data: {
        objectKey,
        currentVersionId: fileVersion.id,
      },
    });
  } catch (error) {
    // Compensating transaction:
    // S3 upload failed, remove DB metadata.
    await db.projectFile.delete({
      where: {
        id: file.id,
      },
    });

    throw error;
  }
}

export async function getFiles(userId: string, projectId: string) {
  await verifyProjectOwnership(userId, projectId);

  return db.projectFile.findMany({
    where: {
      projectId,
    },
    orderBy: {
      path: "asc",
    },
  });
}

export async function getFile(
  userId: string,
  projectId: string,
  fileId: string,
) {
  await verifyProjectOwnership(userId, projectId);

  const file = await db.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
    },
    include: {
      currentVersion: true,
    },
  });

  if (!file) {
    throw new Error("File not found");
  }

  const content = await storage.get(file.objectKey);

  return {
    ...file,
    content: content.toString("utf8"),
  };
}

export async function updateFile(
  userId: string,
  projectId: string,
  fileId: string,
  input: UpdateFileInput,
) {
  await verifyProjectOwnership(userId, projectId);

  const existingFile = await db.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
    },
  });

  if (!existingFile) {
    throw new Error("File not found");
  }

  const newPath = input.path
    ? validateProjectPath(input.path)
    : existingFile.path;

  if (newPath !== existingFile.path) {
    const duplicate = await db.projectFile.findUnique({
      where: {
        projectId_path: {
          projectId,
          path: newPath,
        },
      },
    });

    if (duplicate) {
      throw new Error("A file already exists at this path");
    }
  }

  let content: Buffer | undefined;

  if (input.content !== undefined) {
    content = Buffer.from(input.content, "utf8");
  }

  const newContentType =
    input.contentType !== undefined
      ? input.contentType
      : existingFile.contentType;

  if (content) {
    const sha256 = calculateSha256(content);

    const version = await getNextVersionNumber(fileId);

    const objectKey = projectFileVersionObjectKey(projectId, fileId, version);

    await storage.put(objectKey, content, newContentType ?? "text/plain");

    const fileVersion = await db.fileVersion.create({
      data: {
        fileId,
        version,
        objectKey,
        size: content.length,
        contentType: newContentType,
        sha256,
      },
    });

    return db.projectFile.update({
      where: {
        id: fileId,
      },
      data: {
        path: newPath,
        size: content.length,
        sha256,
        contentType: newContentType,
        objectKey,
        currentVersionId: fileVersion.id,
      },
      include: {
        currentVersion: true,
      },
    });
  }

  return db.projectFile.update({
    where: {
      id: fileId,
    },
    data: {
      path: newPath,
      contentType: newContentType,
    },
  });
}

export async function deleteFile(
  userId: string,
  projectId: string,
  fileId: string,
) {
  await verifyProjectOwnership(userId, projectId);

  const file = await db.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
    },
  });

  if (!file) {
    throw new Error("File not found");
  }

  await storage.delete(file.objectKey);

  await db.projectFile.delete({
    where: {
      id: fileId,
    },
  });

  return {
    success: true,
  };
}

export async function getFileVersions(
  userId: string,
  projectId: string,
  fileId: string,
) {
  await verifyProjectOwnership(userId, projectId);

  const file = await db.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
    },
  });

  if (!file) {
    throw new AppError(404, "File not found");
  }

  return db.fileVersion.findMany({
    where: {
      fileId,
    },
    orderBy: {
      version: "desc",
    },
  });
}

export async function getFileVersion(
  userId: string,
  projectId: string,
  fileId: string,
  versionNumber: number,
) {
  await verifyProjectOwnership(userId, projectId);

  const file = await db.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
    },
  });

  if (!file) {
    throw new AppError(404, "File not found");
  }

  const version = await db.fileVersion.findUnique({
    where: {
      fileId_version: {
        fileId,
        version: versionNumber,
      },
    },
  });

  if (!version) {
    throw new AppError(404, "Version not found");
  }

  const content = await storage.get(version.objectKey);

  return {
    ...version,
    content: content.toString("utf8"),
  };
}

export async function restoreFileVersion(
  userId: string,
  projectId: string,
  fileId: string,
  versionNumber: number,
) {
  await verifyProjectOwnership(userId, projectId);

  const file = await db.projectFile.findFirst({
    where: {
      id: fileId,
      projectId,
    },
  });

  if (!file) {
    throw new AppError(404, "File not found");
  }

  const sourceVersion = await db.fileVersion.findUnique({
    where: {
      fileId_version: {
        fileId,
        version: versionNumber,
      },
    },
  });

  if (!sourceVersion) {
    throw new AppError(404, "Version not found");
  }

  const content = await storage.get(sourceVersion.objectKey);

  const newVersion = await getNextVersionNumber(fileId);

  const objectKey = projectFileVersionObjectKey(projectId, fileId, newVersion);

  await storage.put(
    objectKey,
    content,
    sourceVersion.contentType ?? "text/plain",
  );

  const createdVersion = await db.fileVersion.create({
    data: {
      fileId,
      version: newVersion,
      objectKey,
      size: sourceVersion.size,
      contentType: sourceVersion.contentType,
      sha256: sourceVersion.sha256,
    },
  });

  return db.projectFile.update({
    where: {
      id: fileId,
    },
    data: {
      size: sourceVersion.size,
      contentType: sourceVersion.contentType,
      sha256: sourceVersion.sha256,
      objectKey,
      currentVersionId: createdVersion.id,
    },
  });
}
