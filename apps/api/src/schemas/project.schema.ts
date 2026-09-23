import { z } from "zod";

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(100, "Project name is too long"),

  description: z.string().trim().max(500, "Description is too long").optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),

  description: z.string().trim().max(500).nullable().optional(),
});

export const projectIdSchema = z.object({
  id: z.string().min(1),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
