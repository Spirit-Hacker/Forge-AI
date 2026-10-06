export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export interface ExecutionEnvironment {
  start(): Promise<void>;

  exec(command: string): Promise<ExecResult>;

  kill(): Promise<void>;

  isRunning(): Promise<boolean>;

  getContainerId(): string | null;
}
