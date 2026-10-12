"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type PreviewProcess = {
  id: string;
  status: "running" | "stopping" | "stopped" | "exited" | "failed";
  stdout: string;
  stderr: string;
  exitCode: number | null;
};

type PreviewResponse = {
  status: PreviewProcess["status"];
  process: PreviewProcess | null;
  url: string | null;
};

interface PreviewPanelProps {
  projectId: string;
}

export default function PreviewPanel({ projectId }: PreviewPanelProps) {
  const [preview, setPreview] = useState<PreviewResponse>({
    status: "stopped",
    process: null,
    url: null,
  });
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frameKey, setFrameKey] = useState(0);

  const refreshStatus = useCallback(async () => {
    try {
      const result = await api<PreviewResponse>(
        `/api/projects/${projectId}/preview`,
      );

      setPreview(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch preview status",
      );
    }
  }, [projectId]);

  useEffect(() => {
    void refreshStatus();

    const interval = window.setInterval(() => {
      void refreshStatus();
    }, 2000);

    return () => window.clearInterval(interval);
  }, [refreshStatus]);

  async function handleStart() {
    try {
      setStarting(true);
      setError(null);

      const result = await api<{
        process: PreviewProcess;
        url: string;
      }>(`/api/projects/${projectId}/preview/start`, {
        method: "POST",
      });

      setPreview({
        status: result.process.status,
        process: result.process,
        url: result.url,
      });

      setFrameKey((key) => key + 1);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start preview");
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    try {
      setStopping(true);
      setError(null);

      await api<{ status: string }>(`/api/projects/${projectId}/preview/stop`, {
        method: "POST",
      });

      setPreview({
        status: "stopped",
        process: null,
        url: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop preview");

      await refreshStatus();
    } finally {
      setStopping(false);
    }
  }

  const running = preview.status === "running";
  const busy = starting || stopping;

  return (
    <section className="flex h-full min-h-0 flex-col bg-zinc-950">
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-zinc-800 px-3">
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`h-2 w-2 rounded-full ${
              running
                ? "bg-emerald-500"
                : preview.status === "failed"
                  ? "bg-red-500"
                  : "bg-zinc-600"
            }`}
          />
          <span className="text-zinc-300">Preview</span>
          <span className="text-xs text-zinc-500">
            {starting
              ? "Starting..."
              : stopping
                ? "Stopping..."
                : preview.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFrameKey((key) => key + 1)}
            disabled={!preview.url || !running}
            className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 disabled:opacity-40"
            title="Refresh preview"
          >
            Refresh
          </button>

          {running ? (
            <button
              type="button"
              onClick={handleStop}
              disabled={busy}
              className="rounded bg-red-950 px-3 py-1 text-xs text-red-300 hover:bg-red-900 disabled:opacity-50"
            >
              {stopping ? "Stopping..." : "Stop"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={busy || preview.status === "stopping"}
              className="rounded bg-emerald-700 px-3 py-1 text-xs text-white hover:bg-emerald-600 disabled:opacity-50"
            >
              {starting ? "Starting..." : "Start Preview"}
            </button>
          )}

          {preview.url && (
            <a
              href={preview.url}
              target="_blank"
              rel="noreferrer"
              className="rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-white"
            >
              Open ↗
            </a>
          )}
        </div>
      </header>

      {error && (
        <div className="shrink-0 border-b border-red-900 bg-red-950/40 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="min-h-0 flex-1">
        {running && preview.url ? (
          <iframe
            key={frameKey}
            src={preview.url}
            title="Forge project preview"
            className="h-full w-full border-0 bg-white"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="text-3xl text-zinc-600">◫</div>

            <p className="text-sm font-medium text-zinc-300">
              {preview.status === "failed"
                ? "Preview failed to start"
                : starting
                  ? "Starting your application..."
                  : "Your preview will appear here"}
            </p>

            {preview.process?.stderr && (
              <pre className="max-h-40 w-full overflow-auto whitespace-pre-wrap rounded-md bg-zinc-900 p-3 text-left text-xs text-red-300">
                {preview.process.stderr}
              </pre>
            )}

            {!starting && preview.status !== "failed" && (
              <p className="text-xs text-zinc-500">
                Start the development server to view your application.
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
