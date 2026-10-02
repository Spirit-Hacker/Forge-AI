import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { setupWebSockets } from "./websocket.js";

const PORT = env.PORT;
const server = http.createServer(app);

setupWebSockets(server);

server.listen(PORT, () => {
  console.log(`Forge API running on http://localhost:${PORT}`);

  console.log(
    `Forge terminal WebSocket running on ws://localhost:${PORT}/ws/terminal`,
  );

  console.log(
    `Forge workspace WebSocket running on ws://localhost:${PORT}/ws/workspace`,
  );
});
