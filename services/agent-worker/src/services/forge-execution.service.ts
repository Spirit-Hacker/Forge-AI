import { ForgeApiClient } from "./forge-api.client.js";

import type {
  AgentProjectContext,
  ExecutionService,
} from "../types/project-context.js";

const DEFAULT_TIMEOUT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ForgeExecutionService implements ExecutionService {
  constructor(private readonly api: ForgeApiClient) {}

  async runCommand(
    context: AgentProjectContext,
    command: string,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    const process = await this.api.startProcess(context.projectId, command);

    const deadline = Date.now() + timeoutMs;

    let latest = {
      status: process.status,
      stdout: process.stdout,
      stderr: process.stderr,
      exitCode: process.exitCode,
    };

    while (latest.status === "running" || latest.status === "stopping") {
      if (Date.now() >= deadline) {
        return {
          processId: process.id,
          ...latest,
          timedOut: true,
        };
      }

      await delay(POLL_INTERVAL_MS);

      latest = await this.getProcess(context, process.id);
    }

    return {
      processId: process.id,
      ...latest,
      timedOut: false,
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
