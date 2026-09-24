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

export interface CurrentVersion {
  id: string;
  fileId: string;
  version: number;
  objectKey: string;
  size: number;
  contentType: string;
  sha256: string;
  createdAt: string;
}

export interface ProjectFileContent extends ProjectFile {
  currentVersion: CurrentVersion;
  content: string;
}

export interface ProjectFileContentResponse {
  file: ProjectFileContent;
}
