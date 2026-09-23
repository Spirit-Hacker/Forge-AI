import type { Response } from "express";

import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

import {
  createFile,
  deleteFile,
  getFile,
  getFiles,
  getFileVersion,
  getFileVersions,
  restoreFileVersion,
  updateFile,
} from "./file.service.js";

import { createFileSchema, updateFileSchema } from "./file.schema.js";
import { AppError } from "../errors/app-error.js";

export async function createFileController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId } = req.params;

  const input = createFileSchema.parse(req.body);

  const file = await createFile(req.user.id, projectId, input);

  return res.status(201).json({
    file,
  });
}

export async function getFilesController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId } = req.params;

  const files = await getFiles(req.user.id, projectId);

  return res.json({
    files,
  });
}

export async function getFileController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, fileId } = req.params;

  const file = await getFile(req.user.id, projectId, fileId);

  return res.json({
    file,
  });
}

export async function updateFileController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, fileId } = req.params;

  const input = updateFileSchema.parse(req.body);

  const file = await updateFile(req.user.id, projectId, fileId, input);

  return res.json({
    file,
  });
}

export async function deleteFileController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, fileId } = req.params;

  const result = await deleteFile(req.user.id, projectId, fileId);

  return res.json(result);
}

export async function getFileVersionsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, fileId } = req.params;

  const versions = await getFileVersions(req.user.id, projectId, fileId);

  return res.status(200).json({
    versions,
  });
}

export async function getFileVersionController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, fileId } = req.params;

  const version = Number(req.params.version);

  if (!Number.isInteger(version) || version < 1) {
    throw new AppError(400, "Invalid version number");
  }

  const fileVersion = await getFileVersion(
    req.user.id,
    projectId,
    fileId,
    version,
  );

  return res.status(200).json({
    version: fileVersion,
  });
}

export async function restoreFileVersionController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, fileId } = req.params;

  const version = Number(req.params.version);

  if (!Number.isInteger(version) || version < 1) {
    throw new AppError(400, "Invalid version number");
  }

  const file = await restoreFileVersion(
    req.user.id,
    projectId,
    fileId,
    version,
  );

  return res.status(200).json({
    file,
  });
}
