import Anthropic from "@anthropic-ai/sdk";

import { env } from "../config/env.js";

import type {
  LLMProvider,
  ProviderRequest,
  ProviderResponse,
  ProviderContentBlock,
} from "./provider.interface.js";

/**
 * Convert Anthropic response blocks into our provider-independent format.
 *
 * Thinking blocks are deliberately not exposed to the agent UI.
 * Text and tool-use blocks are retained.
 */
function normalizeContent(
  content: Anthropic.Messages.ContentBlock[],
): ProviderContentBlock[] {
  const normalized: ProviderContentBlock[] = [];

  for (const block of content) {
    switch (block.type) {
      case "text":
        normalized.push({
          type: "text",
          text: block.text,
        });
        break;

      case "tool_use":
        normalized.push({
          type: "tool_use",
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
        break;

      case "thinking":
      case "redacted_thinking":
        // Never expose internal reasoning in the user-facing response.
        // These blocks are not needed by our current single-turn integration.
        break;

      default:
        // Ignore unsupported non-action response blocks.
        break;
    }
  }

  return normalized;
}

export class AnthropicProvider implements LLMProvider {
  private readonly client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.ANTHROPIC_API_KEY,
    });
  }

  async createMessage(request: ProviderRequest): Promise<ProviderResponse> {
    const response = await this.client.messages.create({
      model: env.ANTHROPIC_MODEL,
      max_tokens: request.maxTokens ?? env.ANTHROPIC_MAX_TOKENS,
      system: request.system,
      messages: request.messages as Anthropic.MessageParam[],
      tools: request.tools as Anthropic.Tool[] | undefined,
    });

    return {
      id: response.id,
      content: normalizeContent(response.content),
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }

  async streamMessage(
    request: ProviderRequest,
    onTextDelta: (text: string) => void,
  ): Promise<ProviderResponse> {
    const stream = this.client.messages.stream({
      model: env.ANTHROPIC_MODEL,
      max_tokens: request.maxTokens ?? env.ANTHROPIC_MAX_TOKENS,
      system: request.system,
      messages: request.messages as Anthropic.MessageParam[],
      tools: request.tools as Anthropic.Tool[] | undefined,
    });

    stream.on("text", onTextDelta);

    const response = await stream.finalMessage();

    return {
      id: response.id,
      content: normalizeContent(response.content),
      stopReason: response.stop_reason,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
