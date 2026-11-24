import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    filePath: z.string().min(1),
    oldText: z.string().min(1),
    newText: z.string(),
  })
  .strict();

type EditFileInput = z.infer<typeof inputSchema>;

export const editFileTool: ToolDefinition<EditFileInput> = {
  name: "edit_file",

  description:
    "Make a targeted edit to an existing project file by replacing an exact " +
    "text snippet. The oldText must match exactly and must occur only once. " +
    "Use read_file first to obtain the exact contents before editing.",

  inputSchema: {
    type: "object",
    properties: {
      filePath: {
        type: "string",
        description: "Relative path of the file to edit.",
      },
      oldText: {
        type: "string",
        description: "Exact existing text to find. Must occur exactly once.",
      },
      newText: {
        type: "string",
        description: "Replacement text.",
      },
    },
    required: ["filePath", "oldText", "newText"],
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    const currentContent = await context.workspace.readFile(
      context.project,
      input.filePath,
    );

    const firstIndex = currentContent.indexOf(input.oldText);

    if (firstIndex === -1) {
      throw new Error(
        `Could not edit ${input.filePath}: the specified oldText was not found. Read the file again and retry with an exact match.`,
      );
    }

    const secondIndex = currentContent.indexOf(
      input.oldText,
      firstIndex + input.oldText.length,
    );

    if (secondIndex !== -1) {
      throw new Error(
        `Could not edit ${input.filePath}: the specified oldText occurs more than once. Provide a larger, more specific snippet.`,
      );
    }

    const updatedContent =
      currentContent.slice(0, firstIndex) +
      input.newText +
      currentContent.slice(firstIndex + input.oldText.length);

    await context.workspace.writeFile(
      context.project,
      input.filePath,
      updatedContent,
    );

    return {
      success: true,
      content: `Successfully edited file: ${input.filePath}`,
      metadata: {
        filePath: input.filePath,
      },
    };
  },
};
