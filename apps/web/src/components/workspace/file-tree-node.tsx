"use client";

import { useState } from "react";

import type { FileTreeNode } from "@/types/file-tree";

interface FileTreeNodeProps {
  node: FileTreeNode;
  depth: number;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

export default function FileTreeNodeComponent({
  node,
  depth,
  selectedFileId,
  onSelectFile,
}: FileTreeNodeProps) {
  const [expanded, setExpanded] = useState(true);

  const paddingLeft = 8 + depth * 14;

  if (node.type === "folder") {
    return (
      <div>
        <button
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
          style={{ paddingLeft }}
        >
          <span className="w-4 text-xs">{expanded ? "▼" : "▶"}</span>

          <span>{expanded ? "📂" : "📁"}</span>

          <span className="truncate">{node.name}</span>
        </button>

        {expanded &&
          node.children.map((child) => (
            <FileTreeNodeComponent
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
            />
          ))}
      </div>
    );
  }

  const selected = node.file?.id === selectedFileId;

  return (
    <button
      onClick={() => {
        if (node.file) {
          onSelectFile(node.file.id);
        }
      }}
      className={`flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm ${
        selected
          ? "bg-zinc-800 text-white"
          : "text-zinc-400 hover:bg-zinc-900 hover:text-white"
      }`}
      style={{ paddingLeft }}
    >
      <span className="w-4" />

      <span>📄</span>

      <span className="truncate">{node.name}</span>
    </button>
  );
}
