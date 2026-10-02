import type { Server as HttpServer } from "node:http";

import { setupTerminalWebSocket } from "./terminal/terminal.ws.js";

import { setupWorkspaceWebSocket } from "./workspace/workspace.ws.js";

export function setupWebSockets(server: HttpServer) {
  const terminalWss = setupTerminalWebSocket();

  const workspaceWss = setupWorkspaceWebSocket();

  server.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (url.pathname === "/ws/terminal") {
      terminalWss.handleUpgrade(request, socket, head, (ws) => {
        terminalWss.emit("connection", ws, request);
      });

      return;
    }

    if (url.pathname === "/ws/workspace") {
      workspaceWss.handleUpgrade(request, socket, head, (ws) => {
        workspaceWss.emit("connection", ws, request);
      });

      return;
    }

    socket.destroy();
  });
}
