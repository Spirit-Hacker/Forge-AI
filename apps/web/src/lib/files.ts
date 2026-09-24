import { api } from "./api";
import type {
  ProjectFile,
  ProjectFileContent,
  ProjectFileContentResponse,
  ProjectFilesResponse,
} from "@/types/file";

export interface CreateFileResponse {
  file: ProjectFile;
}

export async function getProjectFiles(projectId: string) {
  const response = await api<ProjectFilesResponse>(
    `/api/projects/${projectId}/files`,
  );

  return response.files;
}

export async function getProjectFile(
  projectId: string,
  fileId: string,
): Promise<ProjectFileContent> {
  const response = await api<ProjectFileContentResponse>(
    `/api/projects/${projectId}/files/${fileId}`,
  );

  console.log("CREATE PROJECT FILE API: ", response);

  return response.file;
}

export async function updateProjectFile(
  projectId: string,
  fileId: string,
  content: string,
  options?: {
    path?: string;
    contentType?: string;
  },
) {
  const response = await api<ProjectFileContentResponse>(
    `/api/projects/${projectId}/files/${fileId}`,
    {
      method: "PUT",
      body: JSON.stringify({
        content,
        path: options?.path,
        contentType: options?.contentType,
      }),
    },
  );

  console.log("UPDATE PROJECT FILE API: ", response);

  return response.file;
}

export async function createProjectFile(
  projectId: string,
  path: string,
  content = "",
  contentType?: string,
) {
  const response = await api<CreateFileResponse>(
    `/api/projects/${projectId}/files`,
    {
      method: "POST",
      body: JSON.stringify({
        path,
        content,
        contentType,
      }),
    },
  );

  return response.file;
}
