import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    filePath: z.string().trim().min(1),
  })
  .strict();

type DeleteFileInput = z.infer<typeof inputSchema>;

export const deleteFileTool: ToolDefinition<DeleteFileInput> = {
  name: "delete_file",

  description:
    "Permanently delete an existing file from the current user's project. " +
    "The file and its stored versions will be deleted. " +
    "Use list_files first to verify the exact relative path. " +
    "Never delete files outside the current project.",

  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Relative path of the file to delete.",
      },
    },
    required: ["filePath"],
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    await context.workspace.deleteFile(context.project, input.filePath);

    return {
      success: true,
      content: `Successfully deleted file: ${input.filePath}`,
      metadata: {
        filePath: input.filePath,
      },
    };
  },
};
