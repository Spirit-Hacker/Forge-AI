import { z } from "zod";

export const createSnapshotSchema = z.object({
  name: z.string().trim().max(100).optional(),

  message: z.string().trim().max(500).optional(),
});

export const snapshotParamsSchema = z.object({
  projectId: z.string().min(1),
});

export const snapshotIdParamsSchema = z.object({
  projectId: z.string().min(1),
  snapshotId: z.string().min(1),
});
