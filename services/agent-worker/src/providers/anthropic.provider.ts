import Anthropic from "@anthropic-ai/sdk";

import { env } from "../config/env.js";

import type {
  LLMProvider,
  ProviderRequest,
  ProviderResponse,
} from "./provider.interface.js";

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

      content: response.content.map((block) => {
        if (block.type === "text") {
          return {
            type: "text" as const,
            text: block.text,
          };
        }

        if (block.type === "tool_use") {
          return {
            type: "tool_use" as const,
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          };
        }

        throw new Error(`Unsupported Anthropic content block: ${block.type}`);
      }),

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

      content: response.content.map((block) => {
        if (block.type === "text") {
          return {
            type: "text" as const,
            text: block.text,
          };
        }

        if (block.type === "tool_use") {
          return {
            type: "tool_use" as const,
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          };
        }

        throw new Error(`Unsupported Anthropic content block: ${block.type}`);
      }),

      stopReason: response.stop_reason,

      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
    };
  }
}
