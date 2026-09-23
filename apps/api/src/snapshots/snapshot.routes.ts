import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/async.handler.js";

import {
  createSnapshotController,
  getSnapshotController,
  getSnapshotsController,
  restoreSnapshotController,
} from "./snapshot.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:projectId/snapshots", asyncHandler(createSnapshotController));

router.get("/:projectId/snapshots", asyncHandler(getSnapshotsController));

router.get(
  "/:projectId/snapshots/:snapshotId",
  asyncHandler(getSnapshotController),
);

router.post(
  "/:projectId/snapshots/:snapshotId/restore",
  asyncHandler(restoreSnapshotController),
);

export default router;
