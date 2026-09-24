"use client";

import { useEffect, useState } from "react";

import { getProjectFile, updateProjectFile } from "@/lib/files";

import WorkspaceHeader from "./workspace-header";
import FileExplorer from "./file-explorer";
import CodeEditor from "./code-editor";
import { OpenFile } from "@/types/editor";
import FileTabs from "./file-tabs";

interface WorkspaceProps {
  projectId: string;
}

export default function Workspace({ projectId }: WorkspaceProps) {
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);

  const [activeFileId, setActiveFileId] = useState<string | null>(null);
  const activeFile = openFiles.find((file) => file.id === activeFileId) ?? null;

  async function handleSelectFile(fileId: string) {
    const alreadyOpen = openFiles.find((file) => file.id === fileId);

    if (alreadyOpen) {
      setActiveFileId(fileId);
      return;
    }

    try {
      setLoadingFile(true);

      const file = await getProjectFile(projectId, fileId);

      const newFile: OpenFile = {
        id: file.id,
        projectId: file.projectId,
        path: file.path,
        content: file.content,
        version: file.currentVersion.version,
        dirty: false,
      };

      setOpenFiles((current) => [...current, newFile]);

      setActiveFileId(file.id);
    } catch (error) {
      console.error("Failed to open file:", error);
    } finally {
      setLoadingFile(false);
    }
  }

  async function handleSave() {
    if (!activeFile) {
      return;
    }

    try {
      setSaving(true);

      const updatedFile = await updateProjectFile(
        projectId,
        activeFile.id,
        activeFile.content,
      );

      setOpenFiles((current) =>
        current.map((file) =>
          file.id === activeFile.id
            ? {
                ...file,
                version: updatedFile.currentVersion.version,
                dirty: false,
              }
            : file,
        ),
      );
    } catch (error) {
      console.error("Failed to save file:", error);
    } finally {
      setSaving(false);
    }
  }

  function handleCloseFile(fileId: string) {
    const file = openFiles.find((item) => item.id === fileId);

    if (!file) {
      return;
    }

    if (file.dirty) {
      const confirmed = window.confirm(
        `${file.path} has unsaved changes. Close anyway?`,
      );

      if (!confirmed) {
        return;
      }
    }

    setOpenFiles((current) => current.filter((item) => item.id !== fileId));

    if (activeFileId !== fileId) {
      return;
    }

    const remaining = openFiles.filter((item) => item.id !== fileId);

    if (remaining.length === 0) {
      setActiveFileId(null);
      return;
    }

    const closedIndex = openFiles.findIndex((item) => item.id === fileId);

    const nextFile = remaining[closedIndex] ?? remaining[remaining.length - 1];

    setActiveFileId(nextFile.id);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();

        if (activeFile?.dirty && !saving) {
          void handleSave();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeFile, saving]);

  function handleEditorChange(value: string) {
    if (!activeFileId) {
      return;
    }

    setOpenFiles((current) =>
      current.map((file) =>
        file.id === activeFileId
          ? {
              ...file,
              content: value,
              dirty: true,
            }
          : file,
      ),
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <WorkspaceHeader />

      <div className="flex min-h-0 flex-1">
        {/* Explorer */}
        <aside className="w-64 shrink-0 border-r border-zinc-800">
          <FileExplorer
            projectId={projectId}
            selectedFileId={activeFileId}
            onSelectFile={handleSelectFile}
          />
        </aside>

        {/* Editor */}
        <main className="relative min-w-0 flex-1">
          <FileTabs
            files={openFiles}
            activeFileId={activeFileId}
            onSelect={setActiveFileId}
            onClose={handleCloseFile}
          />

          {loadingFile ? (
            <div className="flex h-[calc(100%-40px)] items-center justify-center text-sm text-zinc-500">
              Loading file...
            </div>
          ) : activeFile ? (
            <div className="h-[calc(100%-40px)]">
              <div className="flex h-10 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <span>{activeFile.path}</span>

                  {activeFile.dirty && (
                    <span className="text-xs text-yellow-500">Unsaved</span>
                  )}

                  <span className="text-xs text-zinc-600">
                    v{activeFile.version}
                  </span>
                </div>

                <button
                  onClick={handleSave}
                  disabled={!activeFile.dirty || saving}
                  className="rounded bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="h-[calc(100%-40px)]">
                <CodeEditor
                  value={activeFile.content}
                  language="typescript"
                  onChange={handleEditorChange}
                />
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-600">
              Select a file to start editing
            </div>
          )}
        </main>

        {/* AI */}
        <aside className="w-80 shrink-0 border-l border-zinc-800">
          <div className="border-b border-zinc-800 p-4 font-medium">
            AI Assistant
          </div>

          <div className="p-4 text-sm text-zinc-500">
            AI coding agent coming soon...
          </div>
        </aside>
      </div>

      {/* Terminal */}
      <div className="h-48 shrink-0 border-t border-zinc-800">
        <div className="border-b border-zinc-800 px-4 py-2 text-sm font-medium">
          Terminal
        </div>

        <div className="p-4 font-mono text-sm text-zinc-500">
          Terminal coming soon...
        </div>
      </div>
    </div>
  );
}
