import { db } from "@forge/db";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../schemas/project.schema.js";

export async function createProject(userId: string, data: CreateProjectInput) {
  return db.project.create({
    data: {
      name: data.name,
      description: data.description,
      userId,
    },
  });
}

export async function getProjects(userId: string) {
  return db.project.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProject(userId: string, projectId: string) {
  return db.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });
}

export async function updateProject(
  userId: string,
  projectId: string,
  data: UpdateProjectInput,
) {
  return db.project.updateMany({
    where: {
      id: projectId,
      userId,
    },
    data,
  });
}

export async function deleteProject(userId: string, projectId: string) {
  return db.project.deleteMany({
    where: {
      id: projectId,
      userId,
    },
  });
}
