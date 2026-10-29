import { api } from "./api";

import type {
  CreateProjectResponse,
  Project,
  ProjectResponse,
  ProjectsResponse,
} from "@/types/project";

export async function getProjects(): Promise<Project[]> {
  const response = await api<ProjectsResponse>("/api/projects");

  return response.data;
}

export async function getProject(projectId: string): Promise<Project> {
  const response = await api<ProjectResponse>(`/api/projects/${projectId}`);

  return response.data;
}

export async function createProject(
  name: string,
  description?: string,
): Promise<Project> {
  const response = await api<CreateProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });

  return response.data;
}

export async function deleteProject(projectId: string): Promise<void> {
  await api(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}
