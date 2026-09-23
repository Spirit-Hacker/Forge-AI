import "dotenv/config";
import app from "./app.js";
import { env } from "./config/env.js";

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`Forge API running on http://localhost:${PORT}`);
});
