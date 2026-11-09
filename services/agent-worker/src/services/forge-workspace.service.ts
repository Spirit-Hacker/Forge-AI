import { ForgeApiClient, type ForgeFile } from "./forge-api.client.js";

import type {
  AgentProjectContext,
  WorkspaceService,
} from "../types/project-context.js";

export class ForgeWorkspaceService implements WorkspaceService {
  constructor(private readonly api: ForgeApiClient) {}

  async listFiles(
    context: AgentProjectContext,
    directory = ".",
  ): Promise<unknown> {
    const { files } = await this.api.listFiles(context.projectId);

    const normalizedDirectory =
      directory === "." ? "" : directory.replace(/\\/g, "/").replace(/\/$/, "");

    return files
      .filter((file) =>
        normalizedDirectory
          ? file.path.startsWith(`${normalizedDirectory}/`)
          : true,
      )
      .map((file) => ({
        id: file.id,
        path: file.path,
        size: file.size,
        contentType: file.contentType,
      }));
  }

  async readFile(
    context: AgentProjectContext,
    filePath: string,
  ): Promise<string> {
    const file = await this.findFile(context, filePath);

    const result = await this.api.getFile(context.projectId, file.id);

    return result.file.content;
  }

  async writeFile(
    context: AgentProjectContext,
    filePath: string,
    content: string,
  ): Promise<void> {
    const existing = await this.findFileOrNull(context, filePath);

    if (existing) {
      await this.api.updateFile(context.projectId, existing.id, { content });
      return;
    }

    await this.api.createFile(context.projectId, {
      path: filePath,
      content,
      contentType: this.getContentType(filePath),
    });
  }

  async deleteFile(
    context: AgentProjectContext,
    filePath: string,
  ): Promise<void> {
    const file = await this.findFile(context, filePath);

    await this.api.deleteFile(context.projectId, file.id);
  }

  async searchCode(
    context: AgentProjectContext,
    query: string,
  ): Promise<unknown> {
    const { files } = await this.api.listFiles(context.projectId);

    const results: Array<{
      path: string;
      matches: string[];
    }> = [];

    for (const file of files) {
      if (!this.isTextFile(file)) continue;

      const { file: contentFile } = await this.api.getFile(
        context.projectId,
        file.id,
      );

      const matchingLines = contentFile.content
        .split("\n")
        .map((line, index) => ({
          line: index + 1,
          content: line,
        }))
        .filter((item) =>
          item.content.toLowerCase().includes(query.toLowerCase()),
        )
        .map((item) => `${item.line}: ${item.content}`);

      if (matchingLines.length > 0) {
        results.push({
          path: file.path,
          matches: matchingLines,
        });
      }
    }

    return results;
  }

  async getDiff(_context: AgentProjectContext): Promise<string> {
    throw new Error(
      "Git diff is not available through the current Forge API yet.",
    );
  }

  private async findFile(
    context: AgentProjectContext,
    filePath: string,
  ): Promise<ForgeFile> {
    const file = await this.findFileOrNull(context, filePath);

    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }

    return file;
  }

  private async findFileOrNull(
    context: AgentProjectContext,
    filePath: string,
  ): Promise<ForgeFile | null> {
    const { files } = await this.api.listFiles(context.projectId);

    return files.find((file) => file.path === filePath) ?? null;
  }

  private isTextFile(file: ForgeFile): boolean {
    const binaryExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".webp",
      ".ico",
      ".pdf",
      ".zip",
      ".woff",
      ".woff2",
      ".ttf",
      ".mp4",
      ".mp3",
    ];

    return !binaryExtensions.some((extension) =>
      file.path.toLowerCase().endsWith(extension),
    );
  }

  private getContentType(filePath: string): string {
    if (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) {
      return "application/typescript";
    }

    if (filePath.endsWith(".jsx") || filePath.endsWith(".js")) {
      return "application/javascript";
    }

    if (filePath.endsWith(".json")) {
      return "application/json";
    }

    if (filePath.endsWith(".html")) {
      return "text/html";
    }

    if (filePath.endsWith(".css")) {
      return "text/css";
    }

    return "text/plain";
  }
}
