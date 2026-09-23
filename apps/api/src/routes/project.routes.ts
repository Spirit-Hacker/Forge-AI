import { Router } from "express";
import { authMiddleware } from "../auth/auth.middleware.js";
import {
  createProjectController,
  getProjectsController,
  getProjectController,
  updateProjectController,
  deleteProjectController,
} from "../controllers/project.controller.js";
import { asyncHandler } from "../middleware/async.handler.js";

const router = Router();

router.use(authMiddleware);
router.post("/", asyncHandler(createProjectController));
router.get("/", asyncHandler(getProjectsController));
router.get("/:id", asyncHandler(getProjectController));
router.patch("/:id", asyncHandler(updateProjectController));
router.delete("/:id", asyncHandler(deleteProjectController));

export default router;
