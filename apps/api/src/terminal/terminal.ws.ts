import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";

import { createTerminal } from "./terminal.service.js";
import { getUserIdFromToken } from "./terminal.auth.js";

interface TerminalMessage {
  type: "input" | "resize" | "close";
  data?: string;
  cols?: number;
  rows?: number;
}

export function setupTerminalWebSocket(server: HttpServer) {
  const wss = new WebSocketServer({
    server,
    path: "/ws/terminal",
  });

  wss.on("connection", async (socket, request) => {
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    // console.log("REUEST URL: ", request.url);
    // console.log("URL: ", url);
    // console.log(`http://${request.headers.host}`);

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

    let terminal: Awaited<ReturnType<typeof createTerminal>> | null = null;

    try {
      terminal = await createTerminal(
        userId,
        projectId,

        (data) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "output",
                data,
              }),
            );
          }
        },

        (exitCode) => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(
              JSON.stringify({
                type: "exit",
                exitCode,
              }),
            );

            socket.close();
          }
        },
      );

      socket.send(
        JSON.stringify({
          type: "ready",
        }),
      );
    } catch (error) {
      console.error("Failed to create terminal:", error);

      socket.close(1011, "Failed to create terminal");

      return;
    }

    socket.on("message", (raw) => {
      try {
        const message = JSON.parse(raw.toString()) as TerminalMessage;

        if (message.type === "input") {
          if (typeof message.data === "string") {
            terminal?.write(message.data);
          }

          return;
        }

        if (message.type === "resize") {
          if (
            typeof message.cols === "number" &&
            typeof message.rows === "number"
          ) {
            terminal?.resize(message.cols, message.rows);
          }

          return;
        }

        if (message.type === "close") {
          terminal?.kill();
        }
      } catch (error) {
        console.error("Invalid terminal message:", error);
      }
    });

    socket.on("close", () => {
      terminal?.kill();
    });

    socket.on("error", () => {
      terminal?.kill();
    });
  });

  return wss;
}
