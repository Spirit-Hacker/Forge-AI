export interface ProjectFile {
  id: string;
  projectId: string;
  path: string;
  objectKey: string;
  size: number;
  contentType: string | null;
  sha256: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectFilesResponse {
  files: ProjectFile[];
}

export interface ProjectFileContent extends ProjectFile {
  version: number;
  content: string;
}

export interface ProjectFileContentResponse {
  file: ProjectFileContent;
}
