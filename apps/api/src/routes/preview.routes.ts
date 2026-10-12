import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/async.handler.js";
import {
  startPreview,
  getPreview,
  stopPreview,
} from "../controllers/preview.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:projectId/preview/start", asyncHandler(startPreview));

router.get("/:projectId/preview", asyncHandler(getPreview));

router.post("/:projectId/preview/stop", asyncHandler(stopPreview));

export default router;
