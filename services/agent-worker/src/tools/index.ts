import { ToolRegistry } from "./tool.registry.js";

import { listFilesTool } from "./list-files.tool.js";
import { readFileTool } from "./read-file.tool.js";
import { writeFileTool } from "./write-file.tool.js";
import { editFileTool } from "./edit-file.tool.js";
import { renameFileTool } from "./rename-file.tool.js";
import { deleteFileTool } from "./delete-file.tool.js";
import { runCommandTool } from "./run-command.tool.js";

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  registry.register(listFilesTool);
  registry.register(readFileTool);
  registry.register(writeFileTool);
  registry.register(editFileTool);
  registry.register(renameFileTool);
  registry.register(deleteFileTool);
  registry.register(runCommandTool);

  return registry;
}
