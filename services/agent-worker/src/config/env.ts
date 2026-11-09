import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  PORT: z.coerce.number().int().positive().default(4001),

  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  ANTHROPIC_API_KEY: z.string().min(1),

  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5-5"),

  ANTHROPIC_MAX_TOKENS: z.coerce.number().int().positive().default(8192),

  FORGE_API_URL: z.string().url().default("http://localhost:4000"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("Invalid agent-worker environment:", parsedEnv.error.flatten());

  process.exit(1);
}

export const env = parsedEnv.data;
