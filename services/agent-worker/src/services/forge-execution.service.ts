import { ForgeApiClient } from "./forge-api.client.js";

import type {
  AgentProjectContext,
  ExecutionService,
} from "../types/project-context.js";

export class ForgeExecutionService implements ExecutionService {
  constructor(private readonly api: ForgeApiClient) {}

  async runCommand(
    context: AgentProjectContext,
    command: string,
    _timeoutMs?: number,
  ) {
    const process = await this.api.startProcess(context.projectId, command);

    return {
      processId: process.id,
      status: process.status,
    };
  }

  async getProcess(context: AgentProjectContext, processId: string) {
    const process = await this.api.getProcess(context.projectId, processId);

    return {
      status: process.status,
      stdout: process.stdout,
      stderr: process.stderr,
      exitCode: process.exitCode,
    };
  }

  async stopProcess(
    context: AgentProjectContext,
    processId: string,
  ): Promise<void> {
    await this.api.stopProcess(context.projectId, processId);
  }
}
