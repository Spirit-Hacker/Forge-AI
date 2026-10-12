import http, { type IncomingMessage, type ServerResponse } from "node:http";
import httpProxy from "http-proxy";

const PORT = Number(process.env.PORT ?? 4000);

const ALLOWED_PORTS = new Set([3000, 4173, 5173]);

interface PreviewTarget {
  projectId: string;
  port: number;
  url: string;
}

function resolvePreviewTarget(req: IncomingMessage): PreviewTarget | null {
  console.log("REQUEST: ", req.headers.host);
  const host = req.headers.host;

  if (!host) {
    return null;
  }

  // Remove the gateway's port from the Host header.
  const hostname = host.replace(/:\d+$/, "").toLowerCase();

  // Example: cmuejixjb000ens55namr1mo1--5173.localhost
  const match = hostname.match(/^([a-z0-9-]+)--(3000|4173|5173)\.localhost$/);

  if (!match) {
    return null;
  }

  const [, projectId, portText] = match;
  const port = Number(portText);

  if (!ALLOWED_PORTS.has(port)) {
    return null;
  }

  return {
    projectId,
    port,
    url: `http://forge-project-${projectId}:${port}`,
  };
}

const proxy = httpProxy.createProxyServer({
  changeOrigin: true,
  ws: true,
  xfwd: true,
});

const server = http.createServer(
  (req: IncomingMessage, res: ServerResponse) => {
    const target = resolvePreviewTarget(req);

    if (!target) {
      res.writeHead(404, {
        "content-type": "text/plain; charset=utf-8",
      });
      res.end("Unknown preview host. Use <projectId>--<port>.localhost:4000.");
      return;
    }

    proxy.web(req, res, { target: target.url }, (error) => {
      console.error(
        `[preview-gateway] ${target.projectId}:${target.port}`,
        error.message,
      );

      if (!res.headersSent) {
        res.writeHead(502, {
          "content-type": "text/plain; charset=utf-8",
        });
      }

      if (!res.writableEnded) {
        res.end(
          "Preview server is unavailable. Start the project's development server.",
        );
      }
    });
  },
);

server.on("upgrade", (req, socket, head) => {
  const target = resolvePreviewTarget(req);

  if (!target) {
    socket.end("HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\n");
    return;
  }

  proxy.ws(req, socket, head, { target: target.url });
});

proxy.on("error", (error) => {
  console.error("[preview-gateway] Proxy error:", error.message);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[preview-gateway] Listening on port ${PORT}`);
});
