import type { AgentToolContext } from "../types/project-context.js";

export interface ToolDefinition<TInput = unknown> {
  name: string;
  description: string;

  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };

  parseInput(input: unknown): TInput;

  execute(input: TInput, context: AgentToolContext): Promise<ToolResult>;
}

export interface ToolResult {
  success: boolean;
  content: string;
  metadata?: Record<string, unknown>;
}
