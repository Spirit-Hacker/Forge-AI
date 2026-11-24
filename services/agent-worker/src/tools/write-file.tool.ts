import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    filePath: z.string().min(1),
    content: z.string(),
  })
  .strict();

type WriteFileInput = z.infer<typeof inputSchema>;

export const writeFileTool: ToolDefinition<WriteFileInput> = {
  name: "write_file",

  description:
    "Create a new file or completely replace the contents of an existing file " +
    "in the current user's project. The file path must be relative to the project root. " +
    "Use read_file first when you need to preserve existing code.",

  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Relative path of the file to create or overwrite.",
      },
      content: {
        type: "string",
        description: "Complete contents to write into the file.",
      },
    },
    required: ["filePath", "content"],
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    await context.workspace.writeFile(
      context.project,
      input.filePath,
      input.content,
    );

    return {
      success: true,
      content: `Successfully wrote file: ${input.filePath}`,
      metadata: {
        filePath: input.filePath,
      },
    };
  },
};
