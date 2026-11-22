import { getLLMProvider } from "../providers/provider.factory.js";

import type { AgentRequest, AgentResponse } from "../types/agent-request.js";

const SYSTEM_PROMPT = `
You are Forge AI, an AI coding assistant inside the Forge development platform.

You help users understand, plan, and implement changes to their own application.

Important rules:
- Only work on the user's project.
- Never attempt to modify Forge platform source code.
- Do not claim to have modified files or executed commands unless tools confirm it.
- Be concise, helpful, and technically accurate.
- If you do not have a tool available to perform an action, explain that limitation.
`;

export class AgentRequestService {
  async run(input: AgentRequest): Promise<AgentResponse> {
    const provider = getLLMProvider();

    const response = await provider.createMessage({
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: input.message,
        },
      ],
    });

    const message = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n");

    return {
      requestId: input.requestId,
      message,
      usage: response.usage,
    };
  }
}

export const agentRequestService = new AgentRequestService();
