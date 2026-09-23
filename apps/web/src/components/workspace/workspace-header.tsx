export default function WorkspaceHeader() {
  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 px-4">
      <div className="flex items-center gap-3">
        <div className="font-semibold">Forge</div>

        <div className="text-zinc-600">/</div>

        <div className="text-sm text-zinc-400">Workspace</div>
      </div>

      <div className="flex items-center gap-2">
        <button className="rounded-md px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white">
          Save
        </button>

        <button className="rounded-md bg-white px-3 py-1.5 text-sm text-black hover:bg-zinc-200">
          Deploy
        </button>
      </div>
    </header>
  );
}
