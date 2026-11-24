import { api } from "./api";

export interface AgentToolActivity {
  id: string;
  toolName: string;
  title: string;
  status: "running" | "completed" | "failed";
  timestamp: string;
}

export interface AgentResponse {
  requestId: string;
  message: string;
  activities: AgentToolActivity[];
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

interface AgentApiResponse {
  data: AgentResponse;
}

export async function sendAgentMessage(
  projectId: string,
  message: string,
): Promise<AgentResponse> {
  const response = await api<AgentApiResponse>(`/api/agent/${projectId}/run`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });

  return response.data;
}
