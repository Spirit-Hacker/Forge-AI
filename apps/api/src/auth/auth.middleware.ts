import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
  };
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: "Authentication required",
    });
  }

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Invalid authorization header",
    });
  }

  const token = authHeader.slice(7);

  if (!token) {
    return res.status(401).json({
      error: "Access token missing",
    });
  }

  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string"
    ) {
      return res.status(401).json({
        error: "Invalid access token",
      });
    }

    req.user = {
      id: payload.sub,
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired access token",
    });
  }
}
