import { syncProjectToWorkspace } from "./workspace.manager.js";

import { WorkspaceWatcher } from "./workspace-watcher.js";

interface WorkspaceSession {
  projectId: string;
  userId: string;
  workspacePath: string;
  watcher: WorkspaceWatcher;
}

class WorkspaceSessionManager {
  private sessions = new Map<string, WorkspaceSession>();

  async getOrCreate(userId: string, projectId: string) {
    const existing = this.sessions.get(projectId);

    if (existing) {
      return existing;
    }

    const workspacePath = await syncProjectToWorkspace(userId, projectId);

    const watcher = new WorkspaceWatcher({
      projectId,
      userId,
      workspacePath,
    });

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
  }

  async close(projectId: string) {
    const session = this.sessions.get(projectId);

    if (!session) {
      return;
    }

    await session.watcher.stop();

    this.sessions.delete(projectId);

    console.log(`[workspace-session] Closed ${projectId}`);
  }

  get(projectId: string) {
    return this.sessions.get(projectId);
  }
}

export const workspaceSessionManager = new WorkspaceSessionManager();
