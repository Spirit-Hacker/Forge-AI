import type { Response } from "express";
import { z } from "zod";

import type { AuthenticatedRequest } from "../auth/auth.middleware.js";
import { AppError } from "../errors/app-error.js";
import { runAgent } from "./agent.service.js";

const runAgentSchema = z
  .object({
    message: z.string().trim().min(1).max(20_000),
  })
  .strict();

export async function runAgentController(
  req: AuthenticatedRequest,
  res: Response,
) {
  const { projectId } = req.params;
  const { message } = runAgentSchema.parse(req.body);

  const authorization = req.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "Authentication required");
  }

  const accessToken = authorization.slice(7);

  const result = await runAgent({
    userId: req.user.id,
    projectId,
    accessToken,
    message,
  });

  return res.status(200).json({
    data: result,
  });
}
