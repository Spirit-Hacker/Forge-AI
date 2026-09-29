import "dotenv/config";
import http from "node:http";
import app from "./app.js";
import { env } from "./config/env.js";
import { setupTerminalWebSocket } from "./terminal/terminal.ws.js";

const PORT = env.PORT;
const server = http.createServer(app);

setupTerminalWebSocket(server);

server.listen(PORT, () => {
  console.log(`Forge API running on http://localhost:${PORT}`);

  console.log(
    `Forge terminal WebSocket running on ws://localhost:${PORT}/ws/terminal`,
  );
});
