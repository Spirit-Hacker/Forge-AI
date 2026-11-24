import { randomUUID } from "node:crypto";

import type { ProviderTool } from "../providers/provider.interface.js";
import type { AgentToolContext } from "../types/project-context.js";

import type {
  ToolActivity,
  ToolActivityListener,
  ToolDefinition,
  ToolResult,
} from "./tool.interface.js";

function getActivityTitle(toolName: string, input: unknown): string {
  const values =
    typeof input === "object" && input !== null
      ? (input as Record<string, unknown>)
      : {};

  const filePath = typeof values.filePath === "string" ? values.filePath : null;

  const directory =
    typeof values.directory === "string" ? values.directory : ".";

  switch (toolName) {
    case "list_files":
      return `Inspecting files in ${directory}`;

    case "read_file":
      return filePath ? `Reading ${filePath}` : "Reading project file";

    case "write_file":
      return filePath ? `Writing ${filePath}` : "Writing project file";

    case "edit_file":
      return filePath ? `Editing ${filePath}` : "Editing project file";

    case "delete_file":
      return filePath ? `Deleting ${filePath}` : "Deleting project file";

    case "search_code":
      return "Searching project code";

    case "run_command":
      return "Running a project command";

    default:
      return `Running ${toolName}`;
  }
}

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
    onActivity?: ToolActivityListener,
  ): Promise<ToolResult> {
    const tool = this.get(name);

    const activity: ToolActivity = {
      id: randomUUID(),
      toolName: name,
      status: "running",
      startedAt: new Date().toISOString(),
      title: getActivityTitle(name, input),
    };

    onActivity?.(activity);

    try {
      const parsedInput = tool.parseInput(input);
      const result = await tool.execute(parsedInput, context);

      onActivity?.({
        ...activity,
        status: result.success ? "completed" : "failed",
        completedAt: new Date().toISOString(),
        message: result.content,
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Tool execution failed";

      onActivity?.({
        ...activity,
        status: "failed",
        completedAt: new Date().toISOString(),
        message,
      });

      return {
        success: false,
        content: message,
      };
    }
  }

  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }
}
