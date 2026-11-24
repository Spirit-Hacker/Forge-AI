import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    filePath: z.string().trim().min(1),
    newPath: z.string().trim().min(1),
  })
  .strict();

type RenameFileInput = z.infer<typeof inputSchema>;

export const renameFileTool: ToolDefinition<RenameFileInput> = {
  name: "rename_file",

  description:
    "Rename or move an existing file within the current user's project. " +
    "Provide the current relative file path and the new relative path. " +
    "Use list_files or read_file first to verify the existing path. " +
    "Do not use this tool to rename directories.",

  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Current relative path of the file.",
      },
      newPath: {
        type: "string",
        description: "New relative path of the file.",
      },
    },
    required: ["filePath", "newPath"],
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    await context.workspace.renameFile(
      context.project,
      input.filePath,
      input.newPath,
    );

    return {
      success: true,
      content: `Successfully renamed ${input.filePath} to ${input.newPath}`,
      metadata: {
        filePath: input.filePath,
        newPath: input.newPath,
      },
    };
  },
};
