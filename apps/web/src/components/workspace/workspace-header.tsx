type MainView = "code" | "preview";

interface WorkspaceHeaderProps {
  mainView: MainView;
  onMainViewChange: (view: MainView) => void;
  onSave: () => void;
  saving: boolean;
  canSave: boolean;
  aiOpen: boolean;
  onToggleAi: () => void;
}

export default function WorkspaceHeader({
  mainView,
  onMainViewChange,
  onSave,
  saving,
  canSave,
  aiOpen,
  onToggleAi,
}: WorkspaceHeaderProps) {
  const base =
    "rounded-md px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500";

  return (
    <header className="z-10 flex h-12 shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="font-semibold tracking-tight text-white">Forge</div>

        <div className="text-zinc-700">/</div>

        <div className="text-sm text-zinc-400">Workspace</div>
      </div>

      <div className="flex items-center gap-2">
        {/* Code / Preview toggle */}
        <div className="mr-1 flex rounded-lg border border-zinc-800 bg-zinc-900 p-0.5">
          <button
            onClick={() => onMainViewChange("code")}
            aria-pressed={mainView === "code"}
            className={`${base} ${
              mainView === "code"
                ? "bg-zinc-700 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Code
          </button>

          <button
            onClick={() => onMainViewChange("preview")}
            aria-pressed={mainView === "preview"}
            className={`${base} ${
              mainView === "preview"
                ? "bg-emerald-950 text-emerald-300 shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Preview
          </button>
        </div>

        {/* AI assistant toggle */}
        <button
          onClick={onToggleAi}
          aria-pressed={aiOpen}
          className={`${base} ${
            aiOpen
              ? "bg-violet-950 text-violet-300"
              : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
          }`}
        >
          AI Assistant
        </button>

        {/* Save */}
        <button
          onClick={onSave}
          disabled={!canSave || saving}
          className={`${base} text-zinc-300 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40`}
        >
          {saving ? "Saving..." : "Save"}
        </button>

        {/* Connect this to deployment when that feature is implemented */}
        <button
          disabled
          title="Deployment is not implemented yet"
          className={`${base} bg-zinc-100 text-zinc-950 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50`}
        >
          Deploy
        </button>
      </div>
    </header>
  );
}
