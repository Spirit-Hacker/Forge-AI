import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/async.handler.js";

import {
  createFileController,
  deleteFileController,
  getFileController,
  getFilesController,
  getFileVersionController,
  getFileVersionsController,
  restoreFileVersionController,
  updateFileController,
} from "./file.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:projectId/files", asyncHandler(createFileController));

router.get("/:projectId/files", asyncHandler(getFilesController));

router.get("/:projectId/files/:fileId", asyncHandler(getFileController));

router.put("/:projectId/files/:fileId", asyncHandler(updateFileController));

router.delete("/:projectId/files/:fileId", asyncHandler(deleteFileController));

router.get(
  "/:projectId/files/:fileId/versions",
  asyncHandler(getFileVersionsController),
);

router.get(
  "/:projectId/files/:fileId/versions/:version",
  asyncHandler(getFileVersionController),
);

router.post(
  "/:projectId/files/:fileId/versions/:version/restore",
  asyncHandler(restoreFileVersionController),
);

export default router;
