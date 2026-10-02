import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

import {
  subscribeWorkspace,
  unsubscribeWorkspace,
} from "./workspace-events.js";

import { getUserIdFromToken } from "../terminal/terminal.auth.js";

export function setupWorkspaceWebSocket() {
  const wss = new WebSocketServer({
    noServer: true,
  });

  wss.on("connection", (socket, request) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);

    const projectId = url.searchParams.get("projectId");

    const token = url.searchParams.get("token");

    if (!projectId || !token) {
      socket.close(1008, "Authentication required");
      return;
    }

    const userId = getUserIdFromToken(token);

    if (!userId) {
      socket.close(1008, "Invalid authentication");
      return;
    }

    subscribeWorkspace(projectId, socket);

    socket.send(
      JSON.stringify({
        type: "ready",
      }),
    );

    socket.on("close", () => {
      unsubscribeWorkspace(projectId, socket);
    });
  });

  return wss;
}
