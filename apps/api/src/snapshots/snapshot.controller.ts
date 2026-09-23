import type { Response } from "express";

import type { AuthenticatedRequest } from "../auth/auth.middleware.js";

import {
  createSnapshotSchema,
  snapshotIdParamsSchema,
  snapshotParamsSchema,
} from "./snapshot.schema.js";

import {
  createSnapshot,
  getSnapshot,
  getSnapshots,
  restoreSnapshot,
} from "./snapshot.service.js";

export async function createSnapshotController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId } = snapshotParamsSchema.parse(req.params);

  const data = createSnapshotSchema.parse(req.body);

  const snapshot = await createSnapshot(
    req.user.id,
    projectId,
    data.name,
    data.message,
  );

  return res.status(201).json({
    snapshot,
  });
}

export async function getSnapshotsController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId } = snapshotParamsSchema.parse(req.params);

  const snapshots = await getSnapshots(req.user.id, projectId);

  return res.json({
    snapshots,
  });
}

export async function getSnapshotController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, snapshotId } = snapshotIdParamsSchema.parse(req.params);

  const snapshot = await getSnapshot(req.user.id, projectId, snapshotId);

  return res.json({
    snapshot,
  });
}

export async function restoreSnapshotController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId, snapshotId } = snapshotIdParamsSchema.parse(req.params);

  const result = await restoreSnapshot(req.user.id, projectId, snapshotId);

  return res.json(result);
}
