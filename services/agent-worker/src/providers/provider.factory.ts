import type { LLMProvider } from "./provider.interface.js";

import { AnthropicProvider } from "./anthropic.provider.js";

let provider: LLMProvider | null = null;

export function getLLMProvider(): LLMProvider {
  if (!provider) {
    provider = new AnthropicProvider();
  }

  return provider;
}
