import { z } from "zod";

export const agentRequestSchema = z
  .object({
    requestId: z.string().uuid(),
    userId: z.string().min(1),
    projectId: z.string().min(1),
    message: z.string().trim().min(1).max(20_000),
  })
  .strict();

export type AgentRequest = z.infer<typeof agentRequestSchema>;

export interface AgentResponse {
  requestId: string;
  message: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}
