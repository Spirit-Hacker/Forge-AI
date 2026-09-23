import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} from "../services/project.service.js";

import {
  createProjectSchema,
  updateProjectSchema,
} from "../schemas/project.schema.js";

export async function createProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = createProjectSchema.parse(req.body);

    const userId = req.user!.id;

    if (!userId) {
      return res.status(401).json({
        error: "Missing user",
      });
    }

    const project = await createProject(userId, data);

    return res.status(201).json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectsController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;

    if (!userId) {
      return res.status(401).json({
        error: "Missing user",
      });
    }

    const projects = await getProjects(userId);

    return res.json({
      data: projects,
    });
  } catch (error) {
    next(error);
  }
}

export async function getProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;

    if (!userId) {
      return res.status(401).json({
        error: "Missing user",
      });
    }

    const project = await getProject(userId, req.params.id);

    if (!project) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    return res.json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const data = updateProjectSchema.parse(req.body);

    const userId = req.user!.id;

    if (!userId) {
      return res.status(401).json({
        error: "Missing user",
      });
    }

    const result = await updateProject(userId, req.params.id, data);

    if (result.count === 0) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    const project = await getProject(userId, req.params.id);

    return res.json({
      data: project,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteProjectController(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user!.id;

    if (!userId) {
      return res.status(401).json({
        error: "Missing user",
      });
    }

    const result = await deleteProject(userId, req.params.id);

    if (result.count === 0) {
      return res.status(404).json({
        error: "Project not found",
      });
    }

    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
