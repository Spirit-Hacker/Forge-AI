import pty from "node-pty";

import { syncProjectToWorkspace } from "../workspace/workspace.manager.js";

export async function createTerminal(
  userId: string,
  projectId: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void,
) {
  const workspacePath = await syncProjectToWorkspace(userId, projectId);

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
