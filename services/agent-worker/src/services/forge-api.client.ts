import { env } from "../config/env.js";

export class ForgeApiClient {
  constructor(private readonly accessToken: string) {}

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await fetch(`${env.FORGE_API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const body = await response.text();

      throw new Error(`Forge API error (${response.status}): ${body}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  async listFiles(projectId: string) {
    return this.request<{ files: ForgeFile[] }>(
      `/api/projects/${encodeURIComponent(projectId)}/files`,
    );
  }

  async getFile(projectId: string, fileId: string) {
    return this.request<{ file: ForgeFile & { content: string } }>(
      `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
    );
  }

  async createFile(
    projectId: string,
    input: {
      path: string;
      content: string;
      contentType?: string;
    },
  ) {
    return this.request<{ file: ForgeFile }>(
      `/api/projects/${encodeURIComponent(projectId)}/files`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  }

  async updateFile(
    projectId: string,
    fileId: string,
    input: {
      path?: string;
      content?: string;
      contentType?: string | null;
    },
  ) {
    return this.request<{ file: ForgeFile }>(
      `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    );
  }

  async renameFile(projectId: string, fileId: string, path: string) {
    return this.request<{ file: ForgeFile }>(
      `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ path }),
      },
    );
  }

  async deleteFile(projectId: string, fileId: string) {
    return this.request<{ success?: boolean }>(
      `/api/projects/${encodeURIComponent(projectId)}/files/${encodeURIComponent(fileId)}`,
      { method: "DELETE" },
    );
  }

  async startProcess(projectId: string, command: string) {
    return this.request<ForgeProcess>(
      `/api/processes/${encodeURIComponent(projectId)}/start`,
      {
        method: "POST",
        body: JSON.stringify({ command }),
      },
    );
  }

  async getProcess(projectId: string, processId: string) {
    return this.request<ForgeProcess>(
      `/api/processes/${encodeURIComponent(projectId)}/${encodeURIComponent(processId)}`,
    );
  }

  async stopProcess(projectId: string, processId: string) {
    return this.request<{ success: boolean; processId: string }>(
      `/api/processes/${encodeURIComponent(projectId)}/${encodeURIComponent(processId)}/stop`,
      { method: "POST" },
    );
  }
}

export interface ForgeFile {
  id: string;
  projectId: string;
  path: string;
  size: number;
  contentType: string | null;
  sha256: string;
}

export interface ForgeProcess {
  id: string;
  projectId: string;
  command: string;
  status: "running" | "stopping" | "stopped" | "exited" | "failed";
  stdout: string;
  stderr: string;
  exitCode: number | null;
  startedAt: string;
  finishedAt: string | null;
}
