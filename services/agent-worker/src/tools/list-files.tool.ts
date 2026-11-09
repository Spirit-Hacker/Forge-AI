import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    directory: z.string().optional().default("."),
  })
  .strict();

type ListFilesInput = z.infer<typeof inputSchema>;

export const listFilesTool: ToolDefinition<ListFilesInput> = {
  name: "list_files",

  description:
    "List files and directories inside the current user's project workspace. " +
    "Use this to understand the project structure. Paths are relative to the project root.",

  inputSchema: {
    type: "object",
    properties: {
      directory: {
        type: "string",
        description: "Relative directory path. Defaults to project root.",
      },
    },
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    const files = await context.workspace.listFiles(
      context.project,
      input.directory,
    );

    return {
      success: true,
      content: JSON.stringify(files),
    };
  },
};
