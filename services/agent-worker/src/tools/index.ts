import { ToolRegistry } from "./tool.registry.js";

import { listFilesTool } from "./list-files.tool.js";
import { readFileTool } from "./read-file.tool.js";

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(listFilesTool);
  registry.register(readFileTool);

  return registry;
}
