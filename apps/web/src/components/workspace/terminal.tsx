"use client";

import { useAuth } from "@/auth/use-auth";
import { useEffect, useRef } from "react";

import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";

import "xterm/css/xterm.css";

interface TerminalProps {
  projectId: string;
}

interface TerminalMessage {
  type: "ready" | "output" | "exit";
  data?: string;
  exitCode?: number;
}

export default function Terminal({ projectId }: TerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const terminalRef = useRef<XTerm | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const { accessToken } = useAuth();

  console.log("ACCESS TOKEN: ", accessToken);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const terminal = new XTerm({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: "Consolas, 'Courier New', monospace",
      theme: {
        background: "#000000",
      },
    });

    const fitAddon = new FitAddon();

    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);

    fitAddon.fit();

    terminalRef.current = terminal;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

    const wsUrl = apiUrl.replace(/^http:/, "ws:").replace(/^https:/, "wss:");

    // const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(
      `${wsUrl}/ws/terminal?projectId=${projectId}&token=${encodeURIComponent(accessToken!)}`,
    );

    console.log(
      "WSS Connection string: ",
      `${wsUrl}/ws/terminal?projectId=${projectId}&token=${encodeURIComponent(accessToken!)}`,
    );
    // const socket = new WebSocket(`${wsUrl}/ws/terminal?projectId=${projectId}`);

    socketRef.current = socket;

    socket.onopen = () => {
      terminal.write("\r\n\x1b[32mConnected to Forge terminal\x1b[0m\r\n");

      socket.send(
        JSON.stringify({
          type: "resize",
          cols: terminal.cols,
          rows: terminal.rows,
        }),
      );
    };

    socket.onmessage = (event) => {
      const message = JSON.parse(event.data) as TerminalMessage;

      if (message.type === "output") {
        terminal.write(message.data ?? "");
      }

      if (message.type === "exit") {
        terminal.write(
          `\r\n\x1b[33mProcess exited with code ${message.exitCode}\x1b[0m\r\n`,
        );
      }
    };

    socket.onerror = () => {
      terminal.write("\r\n\x1b[31mTerminal connection error\x1b[0m\r\n");
    };

    socket.onclose = () => {
      terminal.write("\r\n\x1b[33mTerminal disconnected\x1b[0m\r\n");
    };

    const disposable = terminal.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "input",
            data,
          }),
        );
      }
    });

    const handleResize = () => {
      fitAddon.fit();

      if (socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "resize",
            cols: terminal.cols,
            rows: terminal.rows,
          }),
        );
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);

      disposable.dispose();

      socket.close();

      terminal.dispose();

      terminalRef.current = null;
      socketRef.current = null;
    };
  }, [projectId, accessToken]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full overflow-hidden bg-black"
    />
  );
}
