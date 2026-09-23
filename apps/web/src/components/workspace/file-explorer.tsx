"use client";

import { useEffect, useMemo, useState } from "react";

import { createProjectFile, getProjectFiles } from "@/lib/files";

import { buildFileTree } from "@/lib/file-tree";

import type { ProjectFile } from "@/types/file";

import FileTreeNode from "./file-tree-node";

interface FileExplorerProps {
  projectId: string;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
}

export default function FileExplorer({
  projectId,
  selectedFileId,
  onSelectFile,
}: FileExplorerProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadFiles() {
      try {
        setError(null);

        const projectFiles = await getProjectFiles(projectId);

        setFiles(projectFiles);
      } catch (error) {
        console.error(error);
        setError("Failed to load files");
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, [projectId]);

  const tree = useMemo(() => buildFileTree(files), [files]);

  async function handleCreateFile() {
    const path = window.prompt("Enter file path", "src/index.ts");

    if (!path) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const file = await createProjectFile(projectId, path, "");

      setFiles((current) => [...current, file]);

      onSelectFile(file.id);
    } catch (error) {
      console.error(error);

      setError(
        error instanceof Error ? error.message : "Failed to create file",
      );
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return <div className="p-4 text-sm text-zinc-500">Loading files...</div>;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium">Explorer</span>

        <button
          onClick={handleCreateFile}
          disabled={creating}
          className="rounded px-2 py-1 text-lg text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-50"
          title="New file"
        >
          +
        </button>
      </div>

      {error && (
        <div className="border-b border-red-900 bg-red-950/30 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {tree.length === 0 ? (
          <div className="px-2 py-4 text-sm text-zinc-500">No files yet</div>
        ) : (
          tree.map((node) => (
            <FileTreeNode
              key={node.path}
              node={node}
              depth={0}
              selectedFileId={selectedFileId}
              onSelectFile={onSelectFile}
            />
          ))
        )}
      </div>
    </div>
  );
}
