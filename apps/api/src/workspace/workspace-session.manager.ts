import { syncProjectToWorkspace } from "./workspace.manager.js";
import { WorkspaceWatcher } from "./workspace-watcher.js";

interface WorkspaceSession {
  projectId: string;
  userId: string;
  workspacePath: string;
  watcher: WorkspaceWatcher;
}

class WorkspaceSessionManager {
  private readonly sessions = new Map<string, WorkspaceSession>();

  private readonly pending = new Map<string, Promise<WorkspaceSession>>();

  async getOrCreate(
    userId: string,
    projectId: string,
  ): Promise<WorkspaceSession> {
    const existing = this.sessions.get(projectId);

    if (existing) {
      if (existing.userId !== userId) {
        throw new Error("Workspace session ownership mismatch");
      }

      return existing;
    }

    const pending = this.pending.get(projectId);

    if (pending) {
      const session = await pending;

      if (session.userId !== userId) {
        throw new Error("Workspace session ownership mismatch");
      }

      return session;
    }

    const creation = this.createSession(userId, projectId);

    this.pending.set(projectId, creation);

    try {
      return await creation;
    } finally {
      if (this.pending.get(projectId) === creation) {
        this.pending.delete(projectId);
      }
    }
  }

  private async createSession(
    userId: string,
    projectId: string,
  ): Promise<WorkspaceSession> {
    const workspacePath = await syncProjectToWorkspace(userId, projectId);

    const watcher = new WorkspaceWatcher({
      projectId,
      userId,
      workspacePath,
    });

    try {
      await watcher.start();

      const session: WorkspaceSession = {
        projectId,
        userId,
        workspacePath,
        watcher,
      };

      this.sessions.set(projectId, session);

      console.log(`[workspace-session] Started ${projectId}`);

      return session;
    } catch (error) {
      await watcher.stop().catch((stopError) => {
        console.error(
          "[workspace-session] Failed to stop watcher after startup failure",
          stopError,
        );
      });

      throw error;
    }
  }

  async close(projectId: string): Promise<void> {
    const pending = this.pending.get(projectId);

    if (pending) {
      try {
        await pending;
      } catch {
        // Session creation failed; continue cleanup.
      }
    }

    const session = this.sessions.get(projectId);

    if (!session) {
      return;
    }

    await session.watcher.stop();

    this.sessions.delete(projectId);

    console.log(`[workspace-session] Closed ${projectId}`);
  }

  get(projectId: string): WorkspaceSession | undefined {
    return this.sessions.get(projectId);
  }
}

export const workspaceSessionManager = new WorkspaceSessionManager();
