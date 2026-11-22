"use client";

import { FormEvent, useState } from "react";

interface CreateProjectDialogProps {
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onCreate: (
    name: string,
    description: string,
    initialPrompt: string,
  ) => Promise<void>;
}

export default function CreateProjectDialog({
  open,
  loading,
  onClose,
  onCreate,
}: CreateProjectDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [initialPrompt, setInitialPrompt] = useState("");

  if (!open) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !initialPrompt.trim()) return;

    await onCreate(name.trim(), description.trim(), initialPrompt.trim());

    setName("");
    setDescription("");
    setInitialPrompt("");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">Create with Forge AI</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Describe the application you want to build.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="project-name"
              className="mb-2 block text-sm font-medium"
            >
              Project name
            </label>
            <input
              id="project-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="My AI application"
              autoFocus
              required
              className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-500"
            />
          </div>

          <div>
            <label
              htmlFor="initial-prompt"
              className="mb-2 block text-sm font-medium"
            >
              What do you want to build?
            </label>
            <textarea
              id="initial-prompt"
              value={initialPrompt}
              onChange={(event) => setInitialPrompt(event.target.value)}
              placeholder="Build a task management application with user authentication, projects, and a Kanban board..."
              rows={5}
              required
              maxLength={20000}
              className="w-full resize-y rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-500"
            />
            <p className="mt-1 text-right text-xs text-zinc-500">
              {initialPrompt.length}/20000
            </p>
          </div>

          <div>
            <label
              htmlFor="project-description"
              className="mb-2 block text-sm font-medium"
            >
              Short description{" "}
              <span className="text-zinc-500">(optional)</span>
            </label>
            <textarea
              id="project-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="A task management application..."
              rows={2}
              className="w-full resize-none rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 outline-none focus:border-zinc-500"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg px-4 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !name.trim() || !initialPrompt.trim()}
              className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
