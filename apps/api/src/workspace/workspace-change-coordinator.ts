import path from "node:path";

interface SuppressedChange {
  expiresAt: number;
}

class WorkspaceChangeCoordinator {
  private suppressed = new Map<string, SuppressedChange>();

  suppress(projectId: string, filePath: string, ttl = 2000) {
    const key = this.getKey(projectId, filePath);

    this.suppressed.set(key, {
      expiresAt: Date.now() + ttl,
    });
  }

  isSuppressed(projectId: string, filePath: string) {
    const key = this.getKey(projectId, filePath);

    const entry = this.suppressed.get(key);

    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.suppressed.delete(key);
      return false;
    }

    this.suppressed.delete(key);

    return true;
  }

  private getKey(projectId: string, filePath: string) {
    return `${projectId}:${path.normalize(filePath)}`;
  }
}

export const workspaceChangeCoordinator = new WorkspaceChangeCoordinator();
