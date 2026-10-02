import chokidar, { type FSWatcher } from "chokidar";
import path from "node:path";
import fs from "node:fs/promises";
import { workspaceChangeCoordinator } from "./workspace-change-coordinator.js";
import { db } from "@forge/db";
import {
  deleteWorkspaceFileFromForge,
  syncWorkspaceFile,
} from "./workspace-sync.service.js";

interface WorkspaceWatcherOptions {
  projectId: string;
  userId: string;
  workspacePath: string;
}

export class WorkspaceWatcher {
  private watcher: FSWatcher | null = null;

  constructor(private readonly options: WorkspaceWatcherOptions) {}

  async start() {
    const { workspacePath } = this.options;

    this.watcher = chokidar.watch(workspacePath, {
      persistent: true,

      // We don't want to sync these directories into Forge.
      ignored: [
        /(^|[\/\\])\.git([\/\\]|$)/,
        /(^|[\/\\])node_modules([\/\\]|$)/,
        /(^|[\/\\])\.next([\/\\]|$)/,
        /(^|[\/\\])dist([\/\\]|$)/,
        /(^|[\/\\])\.turbo([\/\\]|$)/,
      ],

      ignoreInitial: true,

      // Helps prevent multiple events for one filesystem operation.
      awaitWriteFinish: {
        stabilityThreshold: 200,
        pollInterval: 100,
      },
    });

    this.watcher.on("ready", () => {
      console.log(`[workspace-watcher] READY: ${workspacePath}`);
    });

    this.watcher.on("add", async (absolutePath) => {
      console.log(`[workspace-watcher] EVENT ADD: ${absolutePath}`);
      await this.handleAdd(absolutePath);
    });

    this.watcher.on("change", async (absolutePath) => {
      console.log(`[workspace-watcher] EVENT CHANGE: ${absolutePath}`);
      await this.handleChange(absolutePath);
    });

    this.watcher.on("unlink", async (absolutePath) => {
      console.log(`[workspace-watcher] EVENT DELETE: ${absolutePath}`);
      await this.handleDelete(absolutePath);
    });

    this.watcher.on("error", (error) => {
      console.error(`[workspace-watcher] ${this.options.projectId}`, error);
    });

    console.log(
      `[workspace-watcher] Started for project ${this.options.projectId}`,
    );
  }

  async stop() {
    if (!this.watcher) {
      return;
    }

    await this.watcher.close();
    this.watcher = null;

    console.log(
      `[workspace-watcher] Stopped for project ${this.options.projectId}`,
    );
  }

  private getRelativePath(absolutePath: string) {
    return path.relative(this.options.workspacePath, absolutePath);
  }

  private async handleAdd(absolutePath: string) {
    const relativePath = this.getRelativePath(absolutePath);

    if (
      workspaceChangeCoordinator.isSuppressed(
        this.options.projectId,
        relativePath,
      )
    ) {
      return;
    }

    console.log(`[workspace-watcher] ADD ${relativePath}`);

    // TODO:
    // Read file → create ProjectFile → create FileVersion
    // → upload to S3.

    await syncWorkspaceFile(
      this.options.userId,
      this.options.projectId,
      relativePath,
    );
  }

  private async handleChange(absolutePath: string) {
    const relativePath = this.getRelativePath(absolutePath);

    if (
      workspaceChangeCoordinator.isSuppressed(
        this.options.projectId,
        relativePath,
      )
    ) {
      return;
    }

    console.log(`[workspace-watcher] CHANGE ${relativePath}`);

    // TODO:
    // Read file → compare hash → create new FileVersion
    // → upload to S3 → update ProjectFile.

    await syncWorkspaceFile(
      this.options.userId,
      this.options.projectId,
      relativePath,
    );
  }

  private async handleDelete(absolutePath: string) {
    const relativePath = this.getRelativePath(absolutePath);

    if (
      workspaceChangeCoordinator.isSuppressed(
        this.options.projectId,
        relativePath,
      )
    ) {
      return;
    }

    console.log(`[workspace-watcher] DELETE ${relativePath}`);

    // TODO:
    // Find ProjectFile → delete S3 versions
    // → delete ProjectFile.

    await deleteWorkspaceFileFromForge(
      this.options.userId,
      this.options.projectId,
      relativePath,
    );
  }
}
