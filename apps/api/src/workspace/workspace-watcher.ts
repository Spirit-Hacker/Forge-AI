import chokidar, { type FSWatcher } from "chokidar";
import path from "node:path";
import fs from "node:fs/promises";
import { workspaceChangeCoordinator } from "./workspace-change-coordinator.js";
import { db } from "@forge/db";
import crypto from "node:crypto";
import {
  deleteWorkspaceFileFromForge,
  syncWorkspaceFile,
} from "./workspace-sync.service.js";
import { broadcastWorkspaceEvent } from "./workspace-events.js";
import { renameWorkspaceFileInForge } from "./workspace-rename.service.js";
import { validateProjectPath } from "../files/file-path.js";

interface WorkspaceWatcherOptions {
  projectId: string;
  userId: string;
  workspacePath: string;
}

interface PendingDelete {
  path: string;
  sha256: string;
  timeout: NodeJS.Timeout;
}

export class WorkspaceWatcher {
  private watcher: FSWatcher | null = null;
  private pendingDeletes: PendingDelete[] = [];

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

    this.watcher.on("addDir", async (absolutePath) => {
      const relativePath = this.getRelativePath(absolutePath);

      console.log(`[workspace-watcher] DIRECTORY ADD ${relativePath}`);
    });

    this.watcher.on("unlinkDir", (absolutePath) => {
      const relativePath = this.getRelativePath(absolutePath);

      console.log(`[workspace-watcher] DIRECTORY DELETE ${relativePath}`);
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

  private async getFileSha256(filePath: string) {
    const content = await fs.readFile(filePath);

    return crypto.createHash("sha256").update(content).digest("hex");
  }

  private async getProjectFileHash(filePath: string) {
    const path = validateProjectPath(filePath);
    const file = await db.projectFile.findFirst({
      where: {
        projectId: this.options.projectId,
        path: path,
        project: {
          userId: this.options.userId,
        },
      },
      include: {
        currentVersion: true,
      },
    });

    return file?.currentVersion?.sha256 ?? null;
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

    const sha256 = await this.getFileSha256(absolutePath);

    const renameCandidate = this.pendingDeletes.find(
      (item) => item.sha256 === sha256,
    );

    if (renameCandidate) {
      clearTimeout(renameCandidate.timeout);

      this.pendingDeletes = this.pendingDeletes.filter(
        (item) => item !== renameCandidate,
      );

      console.log(
        `[workspace-watcher] RENAME ${renameCandidate.path} → ${relativePath}`,
      );

      try {
        await renameWorkspaceFileInForge(
          this.options.userId,
          this.options.projectId,
          renameCandidate.path,
          relativePath,
        );

        return;
      } catch (error) {
        console.error(
          `[workspace-watcher] Failed to rename ${renameCandidate.path} → ${relativePath}`,
          error,
        );
      }
    }

    console.log(`[workspace-watcher] ADD ${relativePath}`);

    try {
      await syncWorkspaceFile(
        this.options.userId,
        this.options.projectId,
        relativePath,
      );

      broadcastWorkspaceEvent({
        type: "file.created",
        projectId: this.options.projectId,
        path: relativePath,
      });
    } catch (error) {
      console.error(
        `[workspace-watcher] Failed to sync added file ${relativePath}`,
        error,
      );
    }
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

    // TODO: ✅
    // Read file → compare hash → create new FileVersion
    // → upload to S3 → update ProjectFile.

    await syncWorkspaceFile(
      this.options.userId,
      this.options.projectId,
      relativePath,
    );

    broadcastWorkspaceEvent({
      type: "file.updated",
      projectId: this.options.projectId,
      path: relativePath,
    });
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

    const sha256 = await this.getProjectFileHash(relativePath);

    console.log(`[workspace-watcher] HASH for ${relativePath}:`, sha256);

    if (!sha256) {
      console.log(
        `[workspace-watcher] No hash found for ${relativePath}, skipping delete`,
      );
      return;
    }

    const timeout = setTimeout(async () => {
      console.log("Delete Time Running: ");
      this.pendingDeletes.filter((item) => item.path !== relativePath);

      try {
        await deleteWorkspaceFileFromForge(
          this.options.userId,
          this.options.projectId,
          relativePath,
        );

        broadcastWorkspaceEvent({
          type: "file.deleted",
          projectId: this.options.projectId,
          path: relativePath,
        });
      } catch (error) {
        console.error(
          `[workspace-watcher] Failed to delete ${relativePath}`,
          error,
        );
      }
    }, 300);

    this.pendingDeletes.push({
      path: relativePath,
      sha256,
      timeout,
    });
  }

  // private async handlePossibleRename(newAbsolutePath: string) {
  //   const newRelativePath = this.getRelativePath(newAbsolutePath);

  //   for (const [oldPath, timeout] of this.pendingDeletes) {
  //     clearTimeout(timeout);
  //     this.pendingDeletes.delete(oldPath);

  //     console.log(`[workspace-watcher] RENAME ${oldPath} → ${newRelativePath}`);

  //     await this.handleRename(oldPath, newRelativePath);

  //     return true;
  //   }

  //   return false;
  // }
}
