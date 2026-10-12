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
const DOCKER_TIMEOUT_MS = 5_000;

function appendOutput(current: string, chunk: string): string {
  return (current + chunk).slice(-MAX_OUTPUT_LENGTH);
}

function dockerCommand(): string {
  return process.platform === "win32" ? "docker.exe" : "docker";
}

function runDocker(
  args: string[],
  timeoutMs = DOCKER_TIMEOUT_MS,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(dockerCommand(), args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const timeout = setTimeout(() => {
      child.kill();
      finish(new Error(`Docker command timed out after ${timeoutMs}ms`));
    }, timeoutMs);

    function finish(error?: Error, exitCode = 1) {
      if (settled) return;

      settled = true;
      clearTimeout(timeout);

      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr, exitCode });
      }
    }

    child.stdout?.on("data", (data: Buffer) => {
      stdout = appendOutput(stdout, data.toString());
    });

    child.stderr?.on("data", (data: Buffer) => {
      stderr = appendOutput(stderr, data.toString());
    });

    child.once("error", (error) => finish(error));
    child.once("close", (code) => finish(undefined, code ?? 1));
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

    // The setsid process becomes the process-group leader.
    // It writes its own PID, then replaces itself with the command shell.
    const script = [
      "set -eu",
      'pidfile="$1"',
      'command="$2"',
      'setsid sh -c \'echo $$ > "$1"; exec sh -lc "$2"\' forge-child "$pidfile" "$command" &',
      "child=$!",
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

    // The PID file stores the process-group leader PID.
    // Stop that group without terminating the project container.

    const script = [
      "set -eu",
      'pidfile="$1"',
      'if [ ! -f "$pidfile" ]; then',
      '  echo "PID file not found: $pidfile" >&2',
      "  exit 1",
      "fi",
      'pgid=$(cat "$pidfile")',
      'case "$pgid" in ""|*[!0-9]*) echo "Invalid process-group ID" >&2; exit 1;; esac',
      'kill -TERM "-$pgid" 2>/dev/null || true',
      "i=0",
      'while [ "$i" -lt 15 ]; do',
      "  alive=$(ps -eo pgid=,stat= | awk -v g=\"$pgid\" '$1 == g && $2 !~ /^Z/ { found=1 } END { print found+0 }')",
      '  [ "$alive" = "0" ] && break',
      "  sleep 0.1",
      "  i=$((i + 1))",
      "done",
      "alive=$(ps -eo pgid=,stat= | awk -v g=\"$pgid\" '$1 == g && $2 !~ /^Z/ { found=1 } END { print found+0 }')",
      'if [ "$alive" != "0" ]; then',
      '  kill -KILL "-$pgid" 2>/dev/null || true',
      "  sleep 0.2",
      "  alive=$(ps -eo pgid=,stat= | awk -v g=\"$pgid\" '$1 == g && $2 !~ /^Z/ { found=1 } END { print found+0 }')",
      "fi",
      'if [ "$alive" != "0" ]; then',
      '  echo "Live processes remain in process group $pgid" >&2',
      "  exit 1",
      "fi",
      'rm -f "$pidfile"',
    ].join("\n");

    try {
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
        throw new Error(
          result.stderr || "Failed to stop the in-container process group",
        );
      }

      // The process group has been signalled. Do not wait indefinitely
      // for docker exec to close, because its client may remain attached.
      if (managed.child.exitCode === null) {
        managed.child.kill();
      }

      managed.status = "stopped";
      managed.finishedAt = new Date();
      managed.exitCode = 0;

      return true;
    } catch (error) {
      managed.status = "failed";
      managed.stderr = appendOutput(
        managed.stderr,
        `\nStop error: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      managed.finishedAt = new Date();

      throw error;
    }
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
