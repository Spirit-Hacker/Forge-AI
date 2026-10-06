import pty from "node-pty";
import { workspaceSessionManager } from "../workspace/workspace-session.manager.js";
import { executionManager } from "../execution/execution-manager.js";

export async function createTerminal(
  userId: string,
  projectId: string,
  onData: (data: string) => void,
  onExit: (exitCode: number) => void,
) {
  const session = await workspaceSessionManager.getOrCreate(userId, projectId);

  const workspacePath = session.workspacePath;

  const environment = await executionManager.getOrCreate(
    projectId,
    workspacePath,
  );

  const containerId = environment.getContainerId();

  if (!containerId) {
    throw new Error("Docker execution environment is not running");
  }

  console.log(`[terminal] Starting terminal in container ${containerId}`);

  const dockerCommand = process.platform === "win32" ? "docker.exe" : "docker";

  const terminal = pty.spawn(
    dockerCommand,
    ["exec", "-it", "--workdir", "/workspace", containerId, "bash", "-l"],
    {
      name: "xterm-256color",

      cols: 120,
      rows: 30,

      // This cwd is for the docker CLI process itself.
      // The actual shell cwd is /workspace because of --workdir.
      cwd: workspacePath,

      env: {
        ...process.env,
        TERM: "xterm-256color",
      },
    },
  );

  terminal.onData(onData);

  terminal.onExit(({ exitCode }) => {
    console.log(`[terminal] Docker terminal exited with code ${exitCode}`);

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
    containerId,
  };
}
