"use client";

import { useState } from "react";

import { getProjectFile } from "@/lib/files";

import WorkspaceHeader from "./workspace-header";
import FileExplorer from "./file-explorer";
import CodeEditor from "./code-editor";

interface WorkspaceProps {
  projectId: string;
}

export default function Workspace({ projectId }: WorkspaceProps) {
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);

  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(null);

  const [code, setCode] = useState("");

  const [loadingFile, setLoadingFile] = useState(false);

  async function handleSelectFile(fileId: string) {
    try {
      setSelectedFileId(fileId);
      setLoadingFile(true);

      const file = await getProjectFile(projectId, fileId);

      setSelectedFilePath(file.path);
      setCode(file.content);
    } catch (error) {
      console.error("Failed to load file:", error);
    } finally {
      setLoadingFile(false);
    }
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      <WorkspaceHeader />

      <div className="flex min-h-0 flex-1">
        {/* Explorer */}
        <aside className="w-64 shrink-0 border-r border-zinc-800">
          <FileExplorer
            projectId={projectId}
            selectedFileId={selectedFileId}
            onSelectFile={handleSelectFile}
          />
        </aside>

        {/* Editor */}
        <main className="relative min-w-0 flex-1">
          {loadingFile ? (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Loading file...
            </div>
          ) : selectedFileId ? (
            <div className="h-full">
              {/* Editor header */}
              <div className="flex h-10 items-center border-b border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-400">
                {selectedFilePath}
              </div>

              <div className="h-[calc(100%-40px)]">
                <CodeEditor
                  value={code}
                  language="typescript"
                  onChange={setCode}
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
