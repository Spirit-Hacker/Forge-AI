import { createServer } from "node:http";

import { env } from "../config/env.js";
import { handleAgentRequest } from "./agent.controller.js";

export function startAgentWorkerServer() {
  const server = createServer(async (req, res) => {
    if (req.method === "POST" && req.url === "/internal/agent/run") {
      await handleAgentRequest(req, res);
      return;
    }

    res.writeHead(404, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        error: "Not found",
      }),
    );
  });

  server.listen(env.PORT, () => {
    console.log(`Forge Agent Worker listening on http://localhost:${env.PORT}`);
  });

  return server;
}
