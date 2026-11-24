import { z } from "zod";

import type { ToolDefinition } from "./tool.interface.js";

const inputSchema = z
  .object({
    command: z.string().trim().min(1).max(4096),
    timeoutMs: z.number().int().min(1000).max(120000).optional(),
  })
  .strict();

type RunCommandInput = z.infer<typeof inputSchema>;

export const runCommandTool: ToolDefinition<RunCommandInput> = {
  name: "run_command",

  description:
    "Execute a shell command inside the current user's provisioned project " +
    "environment. Use this for installing dependencies, building the project, " +
    "running tests, and inspecting errors. Commands execute in the project " +
    "container, not the user's interactive terminal. The default timeout is " +
    "60 seconds and the maximum is 120 seconds. If the command times out, " +
    "the process may still be running. Never access Forge platform source " +
    "code or files belonging to another project.",

  inputSchema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "Shell command to execute inside the project environment.",
      },
      timeoutMs: {
        type: "number",
        description: "Maximum wait time in milliseconds. Defaults to 60000.",
      },
    },
    required: ["command"],
  },

  parseInput(input) {
    return inputSchema.parse(input);
  },

  async execute(input, context) {
    const result = await context.execution.runCommand(
      context.project,
      input.command,
      input.timeoutMs,
    );

    const output = [
      `Command: ${input.command}`,
      `Process ID: ${result.processId}`,
      `Status: ${result.status}`,
      `Exit code: ${result.exitCode ?? "Not finished"}`,
      result.timedOut
        ? "Warning: Command execution timed out while waiting."
        : "",
      "",
      "STDOUT:",
      result.stdout || "(no stdout)",
      "",
      "STDERR:",
      result.stderr || "(no stderr)",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      success:
        !result.timedOut && result.status === "exited" && result.exitCode === 0,
      content: output,
      metadata: {
        processId: result.processId,
        status: result.status,
        exitCode: result.exitCode,
        timedOut: result.timedOut,
      },
    };
  },
};
