import { Router } from "express";
import { workspaceSessionManager } from "../workspace/workspace-session.manager.js";
import { executionManager } from "./execution-manager.js";
import { authMiddleware } from "../auth/auth.middleware.js";

const router = Router();
router.use(authMiddleware);

router.post("/:projectId/start", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;

    const workspace = await workspaceSessionManager.getOrCreate(
      userId,
      projectId,
    );

    const environment = await executionManager.getOrCreate(
      projectId,
      workspace.workspacePath,
    );

    res.json({
      projectId,
      containerId: environment.getContainerId(),
    });
  } catch (error) {
    next(error);
  }
});

router.post("/:projectId/exec", async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const { projectId } = req.params;

    const workspace = await workspaceSessionManager.getOrCreate(
      userId,
      projectId,
    );

    const environment = await executionManager.getOrCreate(
      projectId,
      workspace.workspacePath,
    );

    const command = req.body.command;

    if (typeof command !== "string" || !command.trim()) {
      return res.status(400).json({
        message: "command is required",
      });
    }

    const result = await environment.exec(command);

    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete("/:projectId", async (req, res, next) => {
  try {
    const { projectId } = req.params;

    await executionManager.close(projectId);

    res.json({
      success: true,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
