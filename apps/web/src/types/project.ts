export type ProvisioningStatus =
  | "NOT_STARTED"
  | "CREATING"
  | "PROVISIONING"
  | "INSTALLING_DEPENDENCIES"
  | "STARTING_PREVIEW"
  | "CHECKING_PREVIEW"
  | "READY"
  | "FAILED";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  userId: string;

  provisioningStatus: ProvisioningStatus;
  provisioningMessage: string | null;
  provisioningError: string | null;

  provisioningStartedAt: string | null;
  provisioningCompletedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface ProjectsResponse {
  data: Project[];
}

export interface CreateProjectResponse {
  data: Project;
}

export interface ProjectResponse {
  data: Project;
}
