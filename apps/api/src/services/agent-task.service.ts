import { db } from "@forge/db";

export async function markInitialTaskReady(projectId: string) {
  return db.agentTask.updateMany({
    where: {
      projectId,
      idempotencyKey: `project:${projectId}:initial`,
      status: "WAITING_FOR_PROVISIONING",
    },
    data: {
      status: "PENDING",
    },
  });
}

export async function markInitialTaskFailed(projectId: string, error: string) {
  return db.agentTask.updateMany({
    where: {
      projectId,
      idempotencyKey: `project:${projectId}:initial`,
      status: "WAITING_FOR_PROVISIONING",
    },
    data: {
      status: "FAILED",
      error,
      completedAt: new Date(),
    },
  });
}
