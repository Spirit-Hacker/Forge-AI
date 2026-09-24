"use client";

import type { OpenFile } from "@/types/editor";

interface FileTabsProps {
  files: OpenFile[];
  activeFileId: string | null;
  onSelect: (fileId: string) => void;
  onClose: (fileId: string) => void;
}

export default function FileTabs({
  files,
  activeFileId,
  onSelect,
  onClose,
}: FileTabsProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="flex h-10 overflow-x-auto border-b border-zinc-800 bg-zinc-950">
      {files.map((file) => {
        const active = file.id === activeFileId;

        return (
          <div
            key={file.id}
            className={`group flex min-w-32 items-center border-r border-zinc-800 ${
              active
                ? "bg-zinc-900 text-white"
                : "text-zinc-500 hover:bg-zinc-900"
            }`}
          >
            <button
              onClick={() => onSelect(file.id)}
              className="flex flex-1 items-center gap-2 px-3 text-left text-sm"
            >
              <span>📄</span>

              <span className="max-w-32 truncate">
                {file.path.split("/").pop()}
              </span>

              {file.dirty && <span className="text-yellow-500">●</span>}
            </button>

            <button
              onClick={() => onClose(file.id)}
              className="px-2 text-zinc-600 hover:text-white"
              title="Close"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
