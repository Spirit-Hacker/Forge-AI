import type { IncomingMessage, ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";

import { env } from "../config/env.js";
import { agentRequestSchema } from "../types/agent-request.js";
import { agentRequestService } from "../services/agent-request.service.js";

function sendJson(res: ServerResponse, statusCode: number, body: unknown) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
  });

  res.end(JSON.stringify(body));
}

function isAuthorized(req: IncomingMessage): boolean {
  const provided = req.headers["x-forge-internal-secret"];

  if (typeof provided !== "string") {
    return false;
  }

  const expectedBuffer = Buffer.from(env.INTERNAL_API_SECRET);
  const providedBuffer = Buffer.from(provided);

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

function getAccessToken(req: IncomingMessage): string | null {
  const authorization = req.headers.authorization;

  if (
    typeof authorization !== "string" ||
    !authorization.startsWith("Bearer ")
  ) {
    return null;
  }

  return authorization.slice(7).trim() || null;
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);

    size += buffer.length;

    if (size > 32_000) {
      throw new Error("Request body too large");
    }

    chunks.push(buffer);
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function handleAgentRequest(
  req: IncomingMessage,
  res: ServerResponse,
) {
  if (!isAuthorized(req)) {
    return sendJson(res, 401, {
      error: "Unauthorized internal request",
    });
  }

  const accessToken = getAccessToken(req);

  if (!accessToken) {
    return sendJson(res, 401, {
      error: "User access token missing",
    });
  }

  try {
    const body = await readBody(req);
    const input = agentRequestSchema.parse(body);

    const result = await agentRequestService.run(input);

    return sendJson(res, 200, {
      data: result,
    });
  } catch (error) {
    console.error(
      "Agent request failed:",
      error instanceof Error ? error.message : "Unknown error",
    );

    return sendJson(res, 500, {
      error: "Agent request failed",
    });
  }
}
