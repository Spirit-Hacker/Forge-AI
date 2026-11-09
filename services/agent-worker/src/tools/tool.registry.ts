import type { ProviderTool } from "../providers/provider.interface.js";
import type { AgentToolContext } from "../types/project-context.js";

import type { ToolDefinition, ToolResult } from "./tool.interface.js";

export class ToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<any>>();

  register<TInput>(tool: ToolDefinition<TInput>): void {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool already registered: ${tool.name}`);
    }

    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition<any> {
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Unknown tool: ${name}`);
    }

    return tool;
  }

  getProviderTools(): ProviderTool[] {
    return Array.from(this.tools.values()).map((tool) => ({
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema,
    }));
  }

  async execute(
    name: string,
    input: unknown,
    context: AgentToolContext,
  ): Promise<ToolResult> {
    const tool = this.get(name);

    try {
      const parsedInput = tool.parseInput(input);

      return await tool.execute(parsedInput, context);
    } catch (error) {
      return {
        success: false,
        content:
          error instanceof Error ? error.message : "Tool execution failed",
      };
    }
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
