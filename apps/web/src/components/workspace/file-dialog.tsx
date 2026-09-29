"use client";

import { useEffect, useState } from "react";

interface FileDialogProps {
  open: boolean;
  title: string;
  initialValue: string;
  submitLabel: string;
  onSubmit: (value: string) => void;
  onClose: () => void;
}

export default function FileDialog({
  open,
  title,
  initialValue,
  submitLabel,
  onSubmit,
  onClose,
}: FileDialogProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = value.trim();

    if (!trimmed) {
      return;
    }

    onSubmit(trimmed);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
      >
        <h2 className="mb-4 text-lg font-medium text-white">{title}</h2>

        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white outline-none focus:border-zinc-500"
        />

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Cancel
          </button>

          <button
            type="submit"
            className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
