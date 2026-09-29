import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

export function getUserIdFromToken(token: string) {
  try {
    const payload = jwt.verify(token, env.ACCESS_TOKEN_SECRET);

    if (
      typeof payload !== "object" ||
      payload === null ||
      typeof payload.sub !== "string"
    ) {
      return null;
    }

    return payload.sub;
  } catch {
    return null;
  }
}
