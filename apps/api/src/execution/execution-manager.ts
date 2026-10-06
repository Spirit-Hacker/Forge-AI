import { DockerExecutionEnvironment } from "./docker-execution-environment.js";
import type { ExecutionEnvironment } from "./execution-environment.js";

interface ExecutionSession {
  projectId: string;
  environment: ExecutionEnvironment;
}

class ExecutionManager {
  private readonly sessions = new Map<string, ExecutionSession>();

  async getOrCreate(
    projectId: string,
    workspacePath: string,
  ): Promise<ExecutionEnvironment> {
    const existing = this.sessions.get(projectId);

    if (existing) {
      const running = await existing.environment.isRunning();

      if (running) {
        return existing.environment;
      }

      this.sessions.delete(projectId);
    }

    const environment = new DockerExecutionEnvironment({
      projectId,
      workspacePath,
    });

    await environment.start();

    this.sessions.set(projectId, {
      projectId,
      environment,
    });

    return environment;
  }

  async close(projectId: string): Promise<void> {
    const session = this.sessions.get(projectId);

    if (!session) {
      return;
    }

    await session.environment.kill();

    this.sessions.delete(projectId);
  }

  get(projectId: string): ExecutionEnvironment | undefined {
    return this.sessions.get(projectId)?.environment;
  }
}

export const executionManager = new ExecutionManager();
