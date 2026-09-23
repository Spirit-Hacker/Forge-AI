import bcrypt from "bcryptjs";
import { db } from "@forge/db";
import type { RegisterInput } from "./auth.schema.js";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import {
  createAccessToken,
  createRefreshToken,
  hashRefreshToken,
} from "./token.js";
import type { email } from "zod";

export async function registerUser(data: RegisterInput) {
  const existingUser = await db.user.findUnique({
    where: {
      email: data.email,
    },
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: passwordHash,
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export async function loginUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const passwordValid = await bcrypt.compare(password, user.password);

  if (!passwordValid) {
    throw new Error("Invalid email or password");
  }

  const accessToken = createAccessToken(user.id);

  const refreshToken = createRefreshToken();

  const refreshTokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: {
      userId: user.id,
      refreshTokenHash,
      expiresAt,
    },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const session = await db.session.findUnique({
    where: {
      refreshTokenHash,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    throw new Error("Invalid refresh token");
  }

  if (session.revokedAt) {
    throw new Error("Session has been revoked");
  }

  if (session.expiresAt <= new Date()) {
    throw new Error("Refresh token expired");
  }

  const newRefreshToken = createRefreshToken();

  const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

  const newAccessToken = createAccessToken(session.userId);

  await db.session.update({
    where: {
      id: session.id,
    },
    data: {
      refreshTokenHash: newRefreshTokenHash,
    },
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresAt: session.expiresAt,
    user: {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
    },
  };
}

export async function logout(refreshToken: string) {
  const refreshTokenHash = hashRefreshToken(refreshToken);

  await db.session.updateMany({
    where: {
      refreshTokenHash,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  });
}

export async function getCurrentUser(userId: string) {
  return db.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });
}
