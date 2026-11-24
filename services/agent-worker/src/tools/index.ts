import { ToolRegistry } from "./tool.registry.js";

import { listFilesTool } from "./list-files.tool.js";
import { readFileTool } from "./read-file.tool.js";
import { writeFileTool } from "./write-file.tool.js";
import { editFileTool } from "./edit-file.tool.js";

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(listFilesTool);
  registry.register(readFileTool);
  registry.register(writeFileTool);
  registry.register(editFileTool);

  return registry;
}
