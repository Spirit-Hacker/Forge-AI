import { api } from "./api";

import type {
  CreateProjectResponse,
  Project,
  ProjectsResponse,
} from "@/types/project";

export async function getProjects() {
  const response = await api<ProjectsResponse>("/api/projects");
  console.log("GET PROJECTS API: ", response);

  return response.data;
}

export async function createProject(name: string, description?: string) {
  const response = await api<CreateProjectResponse>("/api/projects", {
    method: "POST",
    body: JSON.stringify({
      name,
      description,
    }),
  });

  return response.data;
}

export async function deleteProject(projectId: string) {
  await api(`/api/projects/${projectId}`, {
    method: "DELETE",
  });
}
