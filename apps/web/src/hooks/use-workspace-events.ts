"use client";

import { useAuth } from "@/auth/use-auth";
import { useEffect } from "react";

export interface WorkspaceEvent {
  type: "ready" | "file.created" | "file.updated" | "file.deleted";

  projectId?: string;
  path?: string;
}

interface UseWorkspaceEventsOptions {
  projectId: string;
  onEvent: (event: WorkspaceEvent) => void;
}

export function useWorkspaceEvents({
  projectId,
  onEvent,
}: UseWorkspaceEventsOptions) {
  const { accessToken } = useAuth();

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    const wsUrl = apiUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

    // Temporary: same authentication approach
    // currently used by the terminal WebSocket.

    if (!accessToken) {
      return;
    }

    console.log(
      "Workspace WSS connection: ",
      `${wsUrl}/ws/workspace?projectId=${encodeURIComponent(
        projectId,
      )}&token=${encodeURIComponent(accessToken)}`,
    );

    const socket = new WebSocket(
      `${wsUrl}/ws/workspace?projectId=${encodeURIComponent(
        projectId,
      )}&token=${encodeURIComponent(accessToken)}`,
    );

    socket.onopen = () => {
      console.log("[workspace-ws] Connected");
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WorkspaceEvent;

        onEvent(message);
      } catch (error) {
        console.error("[workspace-ws] Invalid message", error);
      }
    };

    socket.onerror = (error) => {
      console.error("[workspace-ws] Error", error);
    };

    socket.onclose = () => {
      console.log("[workspace-ws] Disconnected");
    };

    return () => {
      socket.close();
    };
  }, [projectId, onEvent]);
}
