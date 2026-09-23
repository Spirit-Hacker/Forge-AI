export interface FileTreeNode {
  name: string;
  path: string;
  type: "file" | "folder";
  file?: {
    id: string;
    path: string;
  };
  children: FileTreeNode[];
}
