import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/async.handler.js";

import {
  startProcessController,
  getProjectProcessesController,
  getProcessController,
  stopProcessController,
} from "../controllers/process.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:projectId/start", asyncHandler(startProcessController));

router.get("/:projectId", asyncHandler(getProjectProcessesController));

router.get("/:projectId/:processId", asyncHandler(getProcessController));

router.post("/:projectId/:processId/stop", asyncHandler(stopProcessController));

export default router;
