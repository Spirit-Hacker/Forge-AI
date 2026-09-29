"use client";

interface FileContextMenuProps {
  x: number;
  y: number;
  onRename: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function FileContextMenu({
  x,
  y,
  onRename,
  onDelete,
  onClose,
}: FileContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div
        className="fixed z-50 w-40 rounded-md border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
        style={{
          left: x,
          top: y,
        }}
      >
        <button
          onClick={onRename}
          className="block w-full px-3 py-2 text-left text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white"
        >
          Rename
        </button>

        <button
          onClick={onDelete}
          className="block w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-zinc-800"
        >
          Delete
        </button>
      </div>
    </>
  );
}
