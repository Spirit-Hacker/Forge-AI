export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  data: Project[];
}

export interface CreateProjectResponse {
  data: Project;
}
