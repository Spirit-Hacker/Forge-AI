import { spawn } from "node:child_process";
import type {
  ExecResult,
  ExecutionEnvironment,
} from "./execution-environment.js";

interface DockerExecutionEnvironmentOptions {
  projectId: string;
  workspacePath: string;
}

function runDocker(args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, {
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("error", reject);

    child.on("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

export class DockerExecutionEnvironment implements ExecutionEnvironment {
  private readonly projectId: string;
  private readonly workspacePath: string;

  private readonly containerName: string;
  private containerId: string | null = null;

  constructor(options: DockerExecutionEnvironmentOptions) {
    this.projectId = options.projectId;
    this.workspacePath = options.workspacePath;

    this.containerName = `forge-project-${this.projectId}`;
  }

  async start(): Promise<void> {
    const existing = await runDocker([
      "ps",
      "-aq",
      "--filter",
      `name=^${this.containerName}$`,
    ]);

    const existingId = existing.stdout.trim();

    if (existingId) {
      const running = await runDocker([
        "inspect",
        "-f",
        "{{.State.Running}}",
        this.containerName,
      ]);

      if (running.stdout.trim() === "true") {
        this.containerId = existingId;
        return;
      }

      await runDocker(["rm", "-f", this.containerName]);
    }

    console.log(`[docker-execution] Starting container ${this.containerName}`);

    const result = await runDocker([
      "run",
      "-d",

      "--name",
      this.containerName,

      "--workdir",
      "/workspace",

      "--memory",
      "1g",

      "--cpus",
      "1",

      "--mount",
      `type=bind,source=${this.workspacePath},target=/workspace`,

      "node:22-bookworm",

      "sleep",
      "infinity",
    ]);

    if (result.exitCode !== 0) {
      throw new Error(`Failed to start Docker container: ${result.stderr}`);
    }

    this.containerId = result.stdout.trim();

    console.log(`[docker-execution] Container started ${this.containerId}`);
  }

  async exec(command: string): Promise<ExecResult> {
    if (!this.containerId) {
      throw new Error("Execution environment is not started");
    }

    const result = await runDocker([
      "exec",
      this.containerId,
      "sh",
      "-lc",
      command,
    ]);

    return {
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  }

  async isRunning(): Promise<boolean> {
    if (!this.containerId) {
      return false;
    }

    const result = await runDocker([
      "inspect",
      "-f",
      "{{.State.Running}}",
      this.containerId,
    ]);

    return result.exitCode === 0 && result.stdout.trim() === "true";
  }

  async kill(): Promise<void> {
    if (!this.containerId) {
      return;
    }

    console.log(`[docker-execution] Stopping ${this.containerName}`);

    await runDocker(["rm", "-f", this.containerId]);

    this.containerId = null;
  }

  getContainerId(): string | null {
    return this.containerId;
  }
}
