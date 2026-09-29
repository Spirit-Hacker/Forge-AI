import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import pty from "node-pty";

const TERMINAL_ROOT = path.join(os.tmpdir(), "forge-terminals");

export async function createTerminal(
  projectId: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void,
) {
  const workspacePath = path.join(TERMINAL_ROOT, projectId);

  await fs.mkdir(workspacePath, {
    recursive: true,
  });

  const shell = process.platform === "win32" ? "powershell.exe" : "bash";

  const shellArgs = process.platform === "win32" ? [] : ["-l"];

  const terminal = pty.spawn(shell, shellArgs, {
    name: "xterm-color",
    cols: 120,
    rows: 30,
    cwd: workspacePath,
    env: {
      ...process.env,
      TERM: "xterm-256color",
    },
  });

  terminal.onData(onData);

  terminal.onExit(({ exitCode }) => {
    onExit(exitCode);
  });

  return {
    write(data: string) {
      terminal.write(data);
    },

    resize(cols: number, rows: number) {
      terminal.resize(cols, rows);
    },

    kill() {
      terminal.kill();
    },

    workspacePath,
  };
}
