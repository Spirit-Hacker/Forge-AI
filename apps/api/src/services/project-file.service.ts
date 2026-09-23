import crypto from "node:crypto";

import { db } from "@forge/db";

import { storage } from "../storage/index.js";
import { projectFileObjectKey } from "../storage/object-key.js";

export async function createProjectFile(
  projectId: string,
  path: string,
  content: Buffer,
  contentType?: string,
) {
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

  const file = await db.projectFile.create({
    data: {
      projectId,
      path,
      objectKey: "pending",
      size: content.length,
      contentType,
      sha256: crypto.createHash("sha256").update(content).digest("hex"),
    },
  });

  const objectKey = projectFileObjectKey(projectId, file.id);

  await storage.put(objectKey, content, contentType);

  return db.projectFile.update({
    where: {
      id: file.id,
    },
    data: {
      objectKey,
    },
  });
}
