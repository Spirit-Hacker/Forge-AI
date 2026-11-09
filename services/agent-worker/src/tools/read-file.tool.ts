import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    filePath: z.string().min(1),
  })
  .strict();

type ReadFileInput = z.infer<typeof inputSchema>;

export const readFileTool: ToolDefinition<ReadFileInput> = {
  name: "read_file",

  description:
    "Read a text file from the current user's project workspace. " +
    "The file path must be relative to the project root.",

  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Relative path of the file to read.",
      },
    },
    required: ["filePath"],
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    const content = await context.workspace.readFile(
      context.project,
      input.filePath,
    );

    return {
      success: true,
      content,
      metadata: {
        filePath: input.filePath,
      },
    };
  },
};
