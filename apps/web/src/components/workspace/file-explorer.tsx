"use client";

import { useEffect, useMemo, useState } from "react";

import {
  createProjectFile,
  deleteProjectFile,
  getProjectFile,
  getProjectFiles,
  renameProjectFile,
  updateProjectFile,
} from "@/lib/files";

import { buildFileTree } from "@/lib/file-tree";

import type { ProjectFile } from "@/types/file";

import FileTreeNode from "./file-tree-node";
import { FileTreeNode as FileTreeNodeType } from "@/types/file-tree";
import FileContextMenu from "./file-context-menu";
import FileDialog from "./file-dialog";

interface FileExplorerProps {
  projectId: string;
  selectedFileId: string | null;
  onSelectFile: (fileId: string) => void;
  onFileDeleted: (fileId: string) => void;
  onFileRenamed: (fileId: string, newPath: string) => void;
}

export default function FileExplorer({
  projectId,
  selectedFileId,
  onSelectFile,
  onFileDeleted,
  onFileRenamed,
}: FileExplorerProps) {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: FileTreeNodeType;
  } | null>(null);

  const [renameNode, setRenameNode] = useState<FileTreeNodeType | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [createFileDialogOpen, setCreateFileDialogOpen] = useState(false);

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

  useEffect(() => {
    loadFiles();
  }, [projectId]);

  function handleContextMenu(event: React.MouseEvent, node: FileTreeNodeType) {
    event.preventDefault();

    console.log("Context menu:", node);

    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  }

  async function handleRename(newPath: string) {
    if (!renameNode?.file) {
      return;
    }

    const fileId = renameNode.file.id;

    try {
      const updatedFile = await renameProjectFile(projectId, fileId, newPath);

      setRenameDialogOpen(false);
      setContextMenu(null);

      onFileRenamed(fileId, updatedFile.path);

      await loadFiles();
    } catch (error) {
      console.error("Failed to rename file:", error);
    }
  }

  async function handleDelete(node: FileTreeNodeType) {
    if (!node.file) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${node.path}"? This cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProjectFile(projectId, node.file.id);

      setContextMenu(null);
      onFileDeleted(node.file.id);

      await loadFiles();
    } catch (error) {
      console.error("Failed to delete file:", error);
    }
  }

  const tree = useMemo(() => buildFileTree(files), [files]);

  function handleCreateFileClick() {
    setCreateFileDialogOpen(true);
  }

  async function handleCreateFile(path: string) {
    try {
      setCreating(true);
      setError(null);

      const file = await createProjectFile(projectId, path, "");

      setFiles((current) => [...current, file]);

      onSelectFile(file.id);
      setCreateFileDialogOpen(false);
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
      {renameDialogOpen && renameNode?.file && (
        <FileDialog
          open={renameDialogOpen}
          title="Rename File"
          initialValue={renameNode.path}
          submitLabel="Rename"
          onSubmit={handleRename}
          onClose={() => setRenameDialogOpen(false)}
        />
      )}
      {createFileDialogOpen && (
        <FileDialog
          open={createFileDialogOpen}
          title="Create File"
          initialValue=""
          submitLabel="Create"
          onSubmit={handleCreateFile}
          onClose={() => setCreateFileDialogOpen(false)}
        />
      )}
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <span className="text-sm font-medium">Explorer</span>

        <button
          onClick={handleCreateFileClick}
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
              onContextMenu={handleContextMenu}
            />
          ))
        )}
      </div>

      {contextMenu && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onRename={() => {
            setRenameNode(contextMenu.node);
            setRenameDialogOpen(true);
          }}
          onDelete={() => {
            console.log("Delete:", contextMenu.node);
            handleDelete(contextMenu.node);
            setContextMenu(null);
          }}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  );
}
