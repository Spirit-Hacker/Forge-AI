import { z } from "zod";

export const createFileSchema = z.object({
  path: z.string().min(1).max(1000),

  content: z.string(),

  contentType: z.string().max(255).optional(),
});

export const updateFileSchema = z.object({
  path: z.string().min(1).max(1000).optional(),

  content: z.string().optional(),

  contentType: z.string().max(255).nullable().optional(),
});

export const projectIdSchema = z.object({
  projectId: z.string().min(1),
});

export const fileParamsSchema = z.object({
  projectId: z.string().min(1),
  fileId: z.string().min(1),
});

export type CreateFileInput = z.infer<typeof createFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
