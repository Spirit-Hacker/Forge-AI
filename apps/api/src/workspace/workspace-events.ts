import { WebSocket } from "ws";

export type WorkspaceEvent =
  | {
      type: "file.created";
      projectId: string;
      path: string;
    }
  | {
      type: "file.updated";
      projectId: string;
      path: string;
    }
  | {
      type: "file.deleted";
      projectId: string;
      path: string;
    };

const projectClients = new Map<string, Set<WebSocket>>();

export function subscribeWorkspace(projectId: string, socket: WebSocket) {
  let clients = projectClients.get(projectId);

  if (!clients) {
    clients = new Set();
    projectClients.set(projectId, clients);
  }

  clients.add(socket);

  socket.on("close", () => {
    unsubscribeWorkspace(projectId, socket);
  });
}

export function unsubscribeWorkspace(projectId: string, socket: WebSocket) {
  const clients = projectClients.get(projectId);

  if (!clients) {
    return;
  }

  clients.delete(socket);

  if (clients.size === 0) {
    projectClients.delete(projectId);
  }
}

export function broadcastWorkspaceEvent(event: WorkspaceEvent) {
  const clients = projectClients.get(event.projectId);

  if (!clients) {
    return;
  }

  const message = JSON.stringify(event);

  for (const socket of clients) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
    }
  }
}
