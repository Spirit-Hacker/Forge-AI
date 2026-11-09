export interface AgentProjectContext {
  userId: string;
  projectId: string;
  workspaceId: string;
  requestId: string;
}

export interface WorkspaceService {
  listFiles(context: AgentProjectContext, directory?: string): Promise<unknown>;

  readFile(context: AgentProjectContext, filePath: string): Promise<string>;

  writeFile(
    context: AgentProjectContext,
    filePath: string,
    content: string,
  ): Promise<void>;

  deleteFile(context: AgentProjectContext, filePath: string): Promise<void>;

  searchCode(context: AgentProjectContext, query: string): Promise<unknown>;

  getDiff(context: AgentProjectContext): Promise<string>;
}

export interface ExecutionService {
  runCommand(
    context: AgentProjectContext,
    command: string,
    timeoutMs?: number,
  ): Promise<{
    processId: string;
    status: string;
  }>;

  getProcess(
    context: AgentProjectContext,
    processId: string,
  ): Promise<{
    status: string;
    stdout: string;
    stderr: string;
    exitCode: number | null;
  }>;

  stopProcess(context: AgentProjectContext, processId: string): Promise<void>;
}

export interface AgentToolContext {
  project: AgentProjectContext;
  workspace: WorkspaceService;
  execution: ExecutionService;
  accessToken: string;
}
