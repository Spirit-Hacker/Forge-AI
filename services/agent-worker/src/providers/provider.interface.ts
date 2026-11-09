export type ProviderRole = "user" | "assistant";

export type ProviderContentBlock =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "tool_use";
      id: string;
      name: string;
      input: Record<string, unknown>;
    }
  | {
      type: "tool_result";
      tool_use_id: string;
      content: string;
      is_error?: boolean;
    };

export interface ProviderMessage {
  role: ProviderRole;
  content: string | ProviderContentBlock[];
}

export interface ProviderTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ProviderRequest {
  system: string;
  messages: ProviderMessage[];
  tools?: ProviderTool[];
  maxTokens?: number;
}

export interface ProviderResponse {
  id: string;
  content: ProviderContentBlock[];
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface LLMProvider {
  createMessage(request: ProviderRequest): Promise<ProviderResponse>;

  streamMessage(
    request: ProviderRequest,
    onTextDelta: (text: string) => void,
  ): Promise<ProviderResponse>;
}
