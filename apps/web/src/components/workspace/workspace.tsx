"use client";

import { useCallback, useEffect, useState } from "react";
import { getProjectFile, updateProjectFile } from "@/lib/files";
import WorkspaceHeader from "./workspace-header";
import FileExplorer from "./file-explorer";
import CodeEditor from "./code-editor";
import { OpenFile } from "@/types/editor";
import FileTabs from "./file-tabs";
import Terminal from "./terminal";
import PreviewPanel from "./preview-panel";

interface WorkspaceProps {
  projectId: string;
}

type MainView = "code" | "preview";

export default function Workspace({ projectId }: WorkspaceProps) {
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openFiles, setOpenFiles] = useState<OpenFile[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | null>(null);

  const [mainView, setMainView] = useState<MainView>("code");
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [aiOpen, setAiOpen] = useState(false);

  const activeFile = openFiles.find((file) => file.id === activeFileId) ?? null;

  async function handleSelectFile(fileId: string) {
    const existing = openFiles.find((file) => file.id === fileId);

    if (existing) {
      setActiveFileId(fileId);
      setMainView("code");
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
      setMainView("code");
    } catch (error) {
      console.error("Failed to open file:", error);
    } finally {
      setLoadingFile(false);
    }
  }

  const handleSave = useCallback(async () => {
    if (!activeFile || !activeFile.dirty || saving) {
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
  }, [activeFile, projectId, saving]);

  function handleCloseFile(fileId: string) {
    const file = openFiles.find((item) => item.id === fileId);

    if (!file) return;

    if (
      file.dirty &&
      !window.confirm(`${file.path} has unsaved changes. Close anyway?`)
    ) {
      return;
    }

    const remaining = openFiles.filter((item) => item.id !== fileId);
    setOpenFiles(remaining);

    if (activeFileId === fileId) {
      const index = openFiles.findIndex((item) => item.id === fileId);
      const nextFile =
        remaining[index] ?? remaining[remaining.length - 1] ?? null;

      setActiveFileId(nextFile?.id ?? null);
    }
  }

  function handleFileDeleted(fileId: string) {
    setOpenFiles((files) => {
      const index = files.findIndex((file) => file.id === fileId);

      if (index === -1) return files;

      const remaining = files.filter((file) => file.id !== fileId);

      if (activeFileId === fileId) {
        const nextFile =
          remaining[index] ?? remaining[index - 1] ?? remaining[0] ?? null;

        setActiveFileId(nextFile?.id ?? null);
      }

      return remaining;
    });
  }

  function handleFileRenamed(fileId: string, newPath: string) {
    setOpenFiles((files) =>
      files.map((file) =>
        file.id === fileId ? { ...file, path: newPath } : file,
      ),
    );
  }

  function handleEditorChange(value: string) {
    if (!activeFileId) return;

    setOpenFiles((files) =>
      files.map((file) =>
        file.id === activeFileId
          ? { ...file, content: value, dirty: true }
          : file,
      ),
    );
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void handleSave();
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <WorkspaceHeader
        mainView={mainView}
        onMainViewChange={setMainView}
        onSave={() => void handleSave()}
        saving={saving}
        canSave={Boolean(activeFile?.dirty)}
        aiOpen={aiOpen}
        onToggleAi={() => setAiOpen((open) => !open)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* File explorer */}
        <aside className="w-56 shrink-0 overflow-hidden border-r border-zinc-800">
          <FileExplorer
            projectId={projectId}
            selectedFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onFileDeleted={handleFileDeleted}
            onFileRenamed={handleFileRenamed}
          />
        </aside>

        {/* Main workspace: editor OR preview */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {mainView === "preview" ? (
            <section className="min-h-0 min-w-0 flex-1 overflow-auto hide-scrollbar">
              <PreviewPanel projectId={projectId} />
            </section>
          ) : (
            <>
              <FileTabs
                files={openFiles}
                activeFileId={activeFileId}
                onSelect={setActiveFileId}
                onClose={handleCloseFile}
              />

              <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
                {loadingFile ? (
                  <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                    Loading file...
                  </div>
                ) : activeFile ? (
                  <div className="flex h-full min-h-0 flex-col">
                    {/* Editor toolbar */}
                    <div className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
                      <div className="flex min-w-0 items-center gap-3 overflow-hidden text-sm text-zinc-400">
                        <span className="truncate">{activeFile.path}</span>

                        {activeFile.dirty && (
                          <span className="shrink-0 text-xs text-amber-400">
                            Unsaved
                          </span>
                        )}

                        <span className="shrink-0 text-xs text-zinc-600">
                          v{activeFile.version}
                        </span>
                      </div>

                      <button
                        onClick={() => void handleSave()}
                        disabled={!activeFile.dirty || saving}
                        className="ml-3 shrink-0 rounded-md bg-zinc-800 px-3 py-1.5 text-xs text-zinc-200 transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>

                    {/* Monaco editor */}
                    <div className="min-h-0 flex-1 overflow-hidden">
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
              </section>
            </>
          )}

          {/* Collapsible terminal */}
          <section
            className={`shrink-0 border-t border-zinc-800 bg-zinc-950 ${
              terminalOpen ? "h-48" : "h-10"
            }`}
          >
            <div className="flex h-10 items-center justify-between border-b border-zinc-800 px-3">
              <button
                onClick={() => setTerminalOpen((open) => !open)}
                aria-expanded={terminalOpen}
                className="flex items-center gap-2 text-xs font-medium text-zinc-300 hover:text-white"
              >
                <span className="text-zinc-500">
                  {terminalOpen ? "⌄" : "›"}
                </span>
                Terminal
              </button>

              <button
                onClick={() => setTerminalOpen((open) => !open)}
                className="rounded px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-800 hover:text-white"
                aria-label={
                  terminalOpen ? "Collapse terminal" : "Expand terminal"
                }
              >
                {terminalOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            {terminalOpen && (
              <div className="h-[calc(100%-2.5rem)] min-h-0 overflow-hidden">
                <Terminal projectId={projectId} />
              </div>
            )}
          </section>
        </main>

        {/* AI assistant: only takes space when opened */}
        {aiOpen && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-zinc-800 bg-zinc-950">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
              <span className="text-sm font-medium">AI Assistant</span>

              <button
                onClick={() => setAiOpen(false)}
                aria-label="Close AI assistant"
                className="rounded px-2 py-1 text-zinc-500 hover:bg-zinc-800 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="p-4 text-sm text-zinc-500">
              AI coding agent coming soon...
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
