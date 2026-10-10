import crypto from "node:crypto";
import { spawn, type ChildProcess } from "node:child_process";

import { executionManager } from "./execution-manager.js";

export type ManagedProcessStatus =
  | "running"
  | "stopping"
  | "stopped"
  | "exited"
  | "failed";

interface ManagedProcess {
  id: string;
  projectId: string;
  containerId: string;
  command: string;
  pid: number | null;
  pidFile: string;
  status: ManagedProcessStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startedAt: Date;
  finishedAt: Date | null;
  child: ChildProcess;
}

export interface ManagedProcessInfo {
  id: string;
  projectId: string;
  command: string;
  pid: number | null;
  status: ManagedProcessStatus;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startedAt: Date;
  finishedAt: Date | null;
}

const MAX_OUTPUT_LENGTH = 100_000;

function appendOutput(current: string, chunk: string) {
  return (current + chunk).slice(-MAX_OUTPUT_LENGTH);
}

function dockerCommand() {
  return process.platform === "win32" ? "docker.exe" : "docker";
}

function runDocker(args: string[]): Promise<{
  stdout: string;
  stderr: string;
  exitCode: number;
}> {
  return new Promise((resolve, reject) => {
    const child = spawn(dockerCommand(), args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    child.once("error", reject);

    child.once("close", (code) => {
      resolve({
        stdout,
        stderr,
        exitCode: code ?? 1,
      });
    });
  });
}

class ProcessManager {
  private readonly processes = new Map<string, ManagedProcess>();

  async start(projectId: string, command: string): Promise<ManagedProcessInfo> {
    const environment = executionManager.get(projectId);

    if (!environment || !(await environment.isRunning())) {
      throw new Error("Execution environment is not running");
    }

    const containerId = environment.getContainerId();

    if (!containerId) {
      throw new Error("Docker container is not running");
    }

    const id = crypto.randomUUID();
    const pidFile = `/tmp/forge-process-${id}.pid`;

    /*
     * Run the command in its own process group inside the container.
     * The PID file lets us stop the in-container process group later.
     */
    const script = [
      "set -eu",
      'setsid sh -lc "$2" &',
      "child=$!",
      'printf "%s\\n" "$child" > "$1"',
      'wait "$child"',
    ].join("\n");

    const child = spawn(
      dockerCommand(),
      [
        "exec",
        containerId,
        "sh",
        "-lc",
        script,
        "forge-process",
        pidFile,
        command,
      ],
      {
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
      },
    );

    const managed: ManagedProcess = {
      id,
      projectId,
      containerId,
      command,
      pid: child.pid ?? null,
      pidFile,
      status: "running",
      stdout: "",
      stderr: "",
      exitCode: null,
      startedAt: new Date(),
      finishedAt: null,
      child,
    };

    this.processes.set(id, managed);

    child.stdout?.on("data", (data: Buffer) => {
      managed.stdout = appendOutput(managed.stdout, data.toString());
    });

    child.stderr?.on("data", (data: Buffer) => {
      managed.stderr = appendOutput(managed.stderr, data.toString());
    });

    child.once("error", (error) => {
      managed.status = "failed";
      managed.stderr = appendOutput(
        managed.stderr,
        `\nProcess launcher error: ${error.message}`,
      );
      managed.finishedAt = new Date();
    });

    child.once("close", (code) => {
      managed.exitCode = code;
      managed.finishedAt = new Date();

      if (managed.status === "stopping" || managed.status === "stopped") {
        managed.status = "stopped";
      } else if (code === 0) {
        managed.status = "exited";
      } else {
        managed.status = "failed";
      }
    });

    return this.toInfo(managed);
  }

  async stop(projectId: string, processId: string): Promise<boolean> {
    const managed = this.processes.get(processId);

    if (!managed || managed.projectId !== projectId) {
      return false;
    }

    if (
      managed.status === "stopped" ||
      managed.status === "exited" ||
      managed.status === "failed"
    ) {
      return false;
    }

    managed.status = "stopping";

    /*
     * Signal the process group inside the container.
     * Wait briefly after SIGTERM, then use SIGKILL if needed.
     */
    const script = [
      'if [ -f "$1" ]; then',
      '  pid=$(cat "$1")',
      '  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null || true',
      "  i=0",
      '  while kill -0 "$pid" 2>/dev/null && [ "$i" -lt 20 ]; do',
      "    sleep 0.1",
      "    i=$((i + 1))",
      "  done",
      '  kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null || true',
      '  rm -f "$1"',
      "fi",
    ].join("\n");

    const result = await runDocker([
      "exec",
      managed.containerId,
      "sh",
      "-lc",
      script,
      "forge-stop",
      managed.pidFile,
    ]);

    if (result.exitCode !== 0) {
      managed.status = "running";
      throw new Error(result.stderr || "Failed to stop in-container process");
    }

    /*
     * The docker exec launcher should exit after its child is stopped.
     * If it does not, terminate the host-side launcher as a fallback.
     */
    if (managed.child.exitCode === null) {
      managed.child.kill();
    }

    managed.status = "stopped";
    managed.finishedAt = new Date();

    return true;
  }

  getProjectProcesses(projectId: string): ManagedProcessInfo[] {
    return [...this.processes.values()]
      .filter((item) => item.projectId === projectId)
      .map((item) => this.toInfo(item));
  }

  get(projectId: string, processId: string): ManagedProcessInfo | undefined {
    const managed = this.processes.get(processId);

    if (!managed || managed.projectId !== projectId) {
      return undefined;
    }

    return this.toInfo(managed);
  }

  private toInfo(item: ManagedProcess): ManagedProcessInfo {
    return {
      id: item.id,
      projectId: item.projectId,
      command: item.command,
      pid: item.pid,
      status: item.status,
      stdout: item.stdout,
      stderr: item.stderr,
      exitCode: item.exitCode,
      startedAt: item.startedAt,
      finishedAt: item.finishedAt,
    };
  }
}

export const processManager = new ProcessManager();
