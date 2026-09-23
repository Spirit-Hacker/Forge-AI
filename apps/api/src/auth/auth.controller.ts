import type { Request, Response } from "express";
import { loginSchema, registerSchema } from "./auth.schema.js";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logout,
  getCurrentUser,
} from "./auth.service.js";
import { env } from "../config/env.js";

export async function registerController(req: Request, res: Response) {
  const data = registerSchema.parse(req.body);

  const user = await registerUser(data);

  return res.status(201).json({
    user,
  });
}

export async function loginController(req: Request, res: Response) {
  const data = loginSchema.parse(req.body);

  const result = await loginUser(data.email, data.password);

  res.cookie("refresh_token", result.refreshToken, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    accessToken: result.accessToken,
    user: result.user,
  });
}

export async function refreshController(req: Request, res: Response) {
  const refreshToken = req.cookies.refresh_token;

  if (!refreshToken) {
    return res.status(401).json({
      error: "Refresh token missing",
    });
  }

  try {
    const result = await refreshAccessToken(refreshToken);

    const remainingMs = result.expiresAt.getTime() - Date.now();

    res.cookie("refresh_token", result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: Math.max(0, remainingMs),
    });

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch {
    return res.status(401).json({
      error: "Invalid refresh token",
    });
  }
}

export async function logoutController(req: Request, res: Response) {
  const refreshToken = req.cookies.refresh_token;

  if (refreshToken) {
    await logout(refreshToken);
  }

  res.clearCookie("refresh_token", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });

  return res.status(204).send();
}

export async function meController(req: Request, res: Response) {
  const user = await getCurrentUser(req.user!.id);

  if (!user) {
    return res.status(404).json({
      error: "User not found",
    });
  }

  return res.status(200).json({
    user,
  });
}
