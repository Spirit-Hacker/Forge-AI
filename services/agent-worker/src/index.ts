// import { env } from "./config/env.js";

// function bootstrap() {
//   console.log("Starting Forge Agent Worker...");
//   console.log(`Environment: ${env.NODE_ENV}`);
//   console.log(`Log level: ${env.LOG_LEVEL}`);

//   console.log("Forge Agent Worker initialized.");
// }

// bootstrap();

import { env } from "./config/env.js";
import { getLLMProvider } from "./providers/provider.factory.js";

async function bootstrap() {
  console.log("Starting Forge Agent Worker...");

  const provider = getLLMProvider();

  const response = await provider.createMessage({
    system: "You are Forge AI, a helpful coding assistant.",
    messages: [
      {
        role: "user",
        content: "Explain what a React component is in two sentences.",
      },
    ],
  });

  for (const block of response.content) {
    if (block.type === "text") {
      console.log(block.text);
    }
  }

  console.log("Model:", env.ANTHROPIC_MODEL);
  console.log("Token usage:", response.usage);
}

bootstrap().catch((error) => {
  console.error("Agent worker failed:", error);
  process.exit(1);
});
