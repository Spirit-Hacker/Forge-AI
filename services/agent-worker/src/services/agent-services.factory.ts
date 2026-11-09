import { ForgeApiClient } from "./forge-api.client.js";
import { ForgeWorkspaceService } from "./forge-workspace.service.js";
import { ForgeExecutionService } from "./forge-execution.service.js";

import type { AgentToolContext } from "../types/project-context.js";

export function createAgentServices(input: {
  userId: string;
  projectId: string;
  workspaceId: string;
  requestId: string;
  accessToken: string;
}): AgentToolContext {
  const api = new ForgeApiClient(input.accessToken);

  return {
    project: {
      userId: input.userId,
      projectId: input.projectId,
      workspaceId: input.workspaceId,
      requestId: input.requestId,
    },

    accessToken: input.accessToken,

    workspace: new ForgeWorkspaceService(api),
    execution: new ForgeExecutionService(api),
  };
}
