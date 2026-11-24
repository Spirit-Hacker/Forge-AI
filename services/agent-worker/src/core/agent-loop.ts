import type {
  LLMProvider,
  ProviderContentBlock,
  ProviderMessage,
} from "../providers/provider.interface.js";

import type { ToolRegistry } from "../tools/tool.registry.js";
import type { ToolActivity } from "../tools/tool.interface.js";
import type { AgentToolContext } from "../types/project-context.js";

interface AgentLoopInput {
  provider: LLMProvider;
  tools: ToolRegistry;
  context: AgentToolContext;
  systemPrompt: string;
  userMessage: string;
  maxRounds?: number;
}

interface AgentLoopResult {
  message: string;
  activities: ToolActivity[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

const DEFAULT_MAX_ROUNDS = 10;

export async function runAgentLoop(
  input: AgentLoopInput,
): Promise<AgentLoopResult> {
  const {
    provider,
    tools,
    context,
    systemPrompt,
    userMessage,
    maxRounds = DEFAULT_MAX_ROUNDS,
  } = input;

  const messages: ProviderMessage[] = [
    {
      role: "user",
      content: userMessage,
    },
  ];

  const activities: ToolActivity[] = [];

  let inputTokens = 0;
  let outputTokens = 0;

  for (let round = 0; round < maxRounds; round++) {
    const response = await provider.createMessage({
      system: systemPrompt,
      messages,
      tools: tools.getProviderTools(),
    });

    inputTokens += response.usage.inputTokens;
    outputTokens += response.usage.outputTokens;

    messages.push({
      role: "assistant",
      content: response.content,
    });

    const text = response.content
      .filter(
        (block): block is Extract<ProviderContentBlock, { type: "text" }> =>
          block.type === "text",
      )
      .map((block) => block.text)
      .join("\n");

    const toolCalls = response.content.filter(
      (block): block is Extract<ProviderContentBlock, { type: "tool_use" }> =>
        block.type === "tool_use",
    );

    if (toolCalls.length === 0) {
      return {
        message: text,
        activities,
        usage: {
          inputTokens,
          outputTokens,
        },
      };
    }

    const toolResults: ProviderContentBlock[] = [];

    for (const toolCall of toolCalls) {
      const result = await tools.execute(
        toolCall.name,
        toolCall.input,
        context,
        (activity) => {
          const existingIndex = activities.findIndex(
            (item) => item.id === activity.id,
          );

          if (existingIndex === -1) {
            activities.push(activity);
          } else {
            activities[existingIndex] = activity;
          }
        },
      );

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolCall.id,
        content: result.content,
        is_error: !result.success,
      });
    }

    messages.push({
      role: "user",
      content: toolResults,
    });
  }

  return {
    message:
      "I reached the maximum number of tool execution rounds. Please review the current project state and try again.",
    activities,
    usage: {
      inputTokens,
      outputTokens,
    },
  };
}
