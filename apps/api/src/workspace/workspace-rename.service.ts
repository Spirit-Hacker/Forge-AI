import { renameFileByPath } from "../files/file.service.js";

import { broadcastWorkspaceEvent } from "./workspace-events.js";

export async function renameWorkspaceFileInForge(
  userId: string,
  projectId: string,
  oldPath: string,
  newPath: string,
) {
  const file = await renameFileByPath(userId, projectId, oldPath, newPath);

  if (!file) {
    return null;
  }

  broadcastWorkspaceEvent({
    type: "file.deleted",
    projectId,
    path: oldPath,
  });

  broadcastWorkspaceEvent({
    type: "file.created",
    projectId,
    path: newPath,
  });

  return file;
}
