import { db } from "@forge/db";

import { AppError } from "../errors/app-error.js";
import { storage } from "../storage/index.js";
import { projectFileVersionObjectKey } from "../storage/object-key.js";

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
    throw new AppError(404, "Project not found");
  }

  return project;
}

export async function createSnapshot(
  userId: string,
  projectId: string,
  name?: string,
  message?: string,
) {
  await verifyProjectOwnership(userId, projectId);

  const files = await db.projectFile.findMany({
    where: {
      projectId,
      currentVersionId: {
        not: null,
      },
    },
    select: {
      id: true,
      currentVersionId: true,
    },
  });

  const snapshot = await db.projectSnapshot.create({
    data: {
      projectId,
      name,
      message,

      files: {
        create: files
          .filter(
            (
              file,
            ): file is {
              id: string;
              currentVersionId: string;
            } => file.currentVersionId !== null,
          )
          .map((file) => ({
            fileId: file.id,
            versionId: file.currentVersionId,
          })),
      },
    },

    include: {
      files: true,
    },
  });

  return snapshot;
}

export async function getSnapshots(userId: string, projectId: string) {
  await verifyProjectOwnership(userId, projectId);

  return db.projectSnapshot.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          files: true,
        },
      },
    },
  });
}

export async function getSnapshot(
  userId: string,
  projectId: string,
  snapshotId: string,
) {
  await verifyProjectOwnership(userId, projectId);

  const snapshot = await db.projectSnapshot.findFirst({
    where: {
      id: snapshotId,
      projectId,
    },
    include: {
      files: {
        include: {
          file: true,
          version: true,
        },
      },
    },
  });

  if (!snapshot) {
    throw new AppError(404, "Snapshot not found");
  }

  return snapshot;
}

export async function restoreSnapshot(
  userId: string,
  projectId: string,
  snapshotId: string,
) {
  await verifyProjectOwnership(userId, projectId);

  const snapshot = await db.projectSnapshot.findFirst({
    where: {
      id: snapshotId,
      projectId,
    },
    include: {
      files: {
        include: {
          file: true,
          version: true,
        },
      },
    },
  });

  if (!snapshot) {
    throw new AppError(404, "Snapshot not found");
  }

  for (const snapshotFile of snapshot.files) {
    const file = snapshotFile.file;
    const sourceVersion = snapshotFile.version;

    const content = await storage.get(sourceVersion.objectKey);

    const latestVersion = await db.fileVersion.findFirst({
      where: {
        fileId: file.id,
      },
      orderBy: {
        version: "desc",
      },
      select: {
        version: true,
      },
    });

    const newVersion = (latestVersion?.version ?? 0) + 1;

    const objectKey = projectFileVersionObjectKey(
      projectId,
      file.id,
      newVersion,
    );

    await storage.put(
      objectKey,
      content,
      sourceVersion.contentType ?? "text/plain",
    );

    const createdVersion = await db.fileVersion.create({
      data: {
        fileId: file.id,
        version: newVersion,
        objectKey,
        size: sourceVersion.size,
        contentType: sourceVersion.contentType,
        sha256: sourceVersion.sha256,
      },
    });

    await db.projectFile.update({
      where: {
        id: file.id,
      },
      data: {
        objectKey,
        size: sourceVersion.size,
        contentType: sourceVersion.contentType,
        sha256: sourceVersion.sha256,
        currentVersionId: createdVersion.id,
      },
    });
  }

  return {
    success: true,
    restoredSnapshotId: snapshotId,
  };
}
