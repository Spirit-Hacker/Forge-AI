export interface OpenFile {
  id: string;
  projectId: string;
  path: string;
  content: string;
  version: number;
  dirty: boolean;
}
