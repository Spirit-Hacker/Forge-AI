import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  ACCESS_TOKEN_SECRET: z.string().min(32),

  ACCESS_TOKEN_EXPIRES_IN: z.string().default("1d"),

  AWS_REGION: z.string().min(1),
  AWS_S3_BUCKET: z.string().min(1),

  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),

  AGENT_WORKER_URL: z.string().url().default("http://localhost:4001"),
  AGENT_WORKER_SECRET: z.string().min(32),
});

export const env = envSchema.parse(process.env);
