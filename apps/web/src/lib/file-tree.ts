import type { ProjectFile } from "@/types/file";
import type { FileTreeNode } from "@/types/file-tree";

export function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
  const root: FileTreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split("/").filter(Boolean);

    let currentLevel = root;
    let currentPath = "";

    parts.forEach((part, index) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      const isFile = index === parts.length - 1;

      let node = currentLevel.find((item) => item.name === part);

      if (!node) {
        node = {
          name: part,
          path: currentPath,
          type: isFile ? "file" : "folder",
          children: [],
        };

        if (isFile) {
          node.file = {
            id: file.id,
            path: file.path,
          };
        }

        currentLevel.push(node);
      }

      currentLevel = node.children;
    });
  }

  sortFileTree(root);

  return root;
}

function sortFileTree(nodes: FileTreeNode[]) {
  nodes.sort((a, b) => {
    // Folders first
    if (a.type !== b.type) {
      return a.type === "folder" ? -1 : 1;
    }

    return a.name.localeCompare(b.name);
  });

  for (const node of nodes) {
    sortFileTree(node.children);
  }
}
