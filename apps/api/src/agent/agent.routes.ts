import { Router } from "express";

import { authMiddleware } from "../auth/auth.middleware.js";
import { asyncHandler } from "../middleware/async.handler.js";
import { runAgentController } from "./agent.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:projectId/run", asyncHandler(runAgentController));

export default router;
