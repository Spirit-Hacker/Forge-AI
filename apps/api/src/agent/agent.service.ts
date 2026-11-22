import crypto from "node:crypto";

import { env } from "../config/env.js";
import { AppError } from "../errors/app-error.js";
import { getProject } from "../services/project.service.js";

interface RunAgentInput {
  userId: string;
  projectId: string;
  accessToken: string;
  message: string;
}

export async function runAgent(input: RunAgentInput) {
  const project = await getProject(input.userId, input.projectId);

  if (!project) {
    throw new AppError(404, "Project not found");
  }

  const requestId = crypto.randomUUID();

  let response: Response;

  try {
    response = await fetch(`${env.AGENT_WORKER_URL}/internal/agent/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forge-internal-secret": env.AGENT_WORKER_SECRET,
        Authorization: `Bearer ${input.accessToken}`,
      },
      body: JSON.stringify({
        requestId,
        userId: input.userId,
        projectId: input.projectId,
        message: input.message,
      }),
      signal: AbortSignal.timeout(120_000),
    });
  } catch {
    throw new AppError(503, "Agent worker is unavailable");
  }

  if (!response.ok) {
    const workerError = await response.text();

    console.error("Agent worker error:", {
      status: response.status,
      error: workerError,
    });

    throw new AppError(502, "Agent worker request failed");
  }

  const result = await response.json();

  return result.data;
}
