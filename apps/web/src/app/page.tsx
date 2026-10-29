"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/auth/use-auth";
import { createProject } from "@/lib/projects";

const suggestions = [
  {
    title: "SaaS dashboard",
    description:
      "Build a modern SaaS analytics dashboard with revenue charts, user metrics, and a clean sidebar.",
  },
  {
    title: "Portfolio website",
    description:
      "Build a creative developer portfolio with an introduction, projects, skills, and contact section.",
  },
  {
    title: "Task manager",
    description:
      "Build a task management application with projects, task cards, priorities, and a kanban board.",
  },
  {
    title: "Landing page",
    description:
      "Build a premium product landing page with a hero section, features, testimonials, and pricing.",
  },
];

function ForgeLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="forge-logo">
        <svg viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2.8 28.2 9.4v13.2L16 29.2 3.8 22.6V9.4L16 2.8Z"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="m19.9 7.8-8.1 9h5l-4.7 7.5 10-10h-5.3l3.1-6.5Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <span className="text-[15px] font-semibold tracking-[0.2em] text-white">
        FORGE
      </span>
    </div>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
      <path
        d="M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeOpacity=".25"
        strokeWidth="3"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function getProjectName(prompt: string): string {
  const cleaned = prompt
    .replace(/^(build|create|make|develop|design)\s+/i, "")
    .replace(/[.!?]+$/g, "")
    .trim();

  if (!cleaned) {
    return "Untitled Project";
  }

  const firstPart = cleaned.split(/\s+/).slice(0, 5).join(" ");

  return (firstPart.charAt(0).toUpperCase() + firstPart.slice(1)).slice(0, 100);
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();

    if (!trimmedPrompt) {
      setError("Describe what you want to build first.");
      return;
    }

    if (trimmedPrompt.length > 500) {
      setError("Your prompt must be 500 characters or fewer.");
      return;
    }

    if (authLoading) return;

    if (!user) {
      router.push("/login");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const project = await createProject(
        getProjectName(trimmedPrompt),
        trimmedPrompt,
      );

      router.push(`/build/${project.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create your project. Please try again.",
      );

      setCreating(false);
    }
  }

  function selectSuggestion(description: string) {
    setPrompt(description);
    setError(null);
  }

  return (
    <main className="forge-home relative min-h-screen overflow-hidden text-white">
      <div className="forge-ambient forge-ambient-one" />
      <div className="forge-ambient forge-ambient-two" />
      <div className="forge-grid" />

      <header className="relative z-10 mx-auto flex h-[76px] max-w-[1440px] items-center justify-between border-b border-white/[0.06] px-6 md:px-12">
        <ForgeLogo />

        <div className="flex items-center gap-5">
          <button
            onClick={() => router.push("/projects")}
            className="hidden text-sm text-white/50 transition hover:text-white sm:block"
          >
            My projects
          </button>

          {authLoading ? (
            <div className="h-9 w-20 animate-pulse rounded-full bg-white/10" />
          ) : user ? (
            <button
              onClick={() => router.push("/projects")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/75 transition hover:bg-white/10"
            >
              Dashboard
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/75 transition hover:bg-white/10"
            >
              Sign in
            </button>
          )}
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[calc(100vh-76px)] max-w-[1100px] flex-col items-center justify-center px-5 pb-24 pt-20 text-center md:px-8">
        <div className="forge-intro-tag mb-8">
          <span className="forge-live-dot" />
          YOUR IDEAS, YOUR ENVIRONMENT, YOUR FORGE
        </div>

        <h1 className="max-w-[850px] text-5xl font-medium leading-[1.04] tracking-[-0.065em] sm:text-6xl md:text-7xl">
          From a spark of an idea
          <br />
          to something <span className="forge-gradient">real.</span>
        </h1>

        <p className="mt-7 max-w-[570px] text-sm leading-7 text-white/45 md:text-base">
          Describe what you want to build. Forge prepares an isolated
          development environment where your ideas can take shape.
        </p>

        <form
          onSubmit={handleCreateProject}
          className="forge-composer mt-12 w-full max-w-[780px] text-left"
        >
          <div className="flex items-center gap-2 px-5 pt-5">
            <SparkIcon />

            <span className="text-[10px] font-medium tracking-[0.18em] text-orange-200/70">
              NEW PROJECT
            </span>
          </div>

          <textarea
            value={prompt}
            onChange={(event) => {
              setPrompt(event.target.value);
              setError(null);
            }}
            maxLength={500}
            disabled={creating}
            rows={4}
            placeholder="Imagine something. What should we build?"
            className="forge-prompt-input w-full resize-none bg-transparent px-5 py-5 text-base leading-7 text-white outline-none placeholder:text-white/25 md:text-lg"
          />

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.07] px-4 py-4">
            <div className="flex items-center gap-3 pl-1">
              <span className="text-[10px] tracking-wider text-white/30">
                REACT + VITE
              </span>

              <span className="h-1 w-1 rounded-full bg-white/20" />

              <span className="text-[10px] tracking-wider text-white/30">
                TYPESCRIPT
              </span>
            </div>

            <button
              type="submit"
              disabled={creating || authLoading || !prompt.trim()}
              className="forge-submit-button flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-medium text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {creating ? (
                <>
                  <LoadingIcon />
                  Creating project
                </>
              ) : (
                <>
                  Start building
                  <ArrowIcon />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-3 flex w-full max-w-[780px] items-center justify-between px-2">
          {error ? (
            <p className="text-xs text-red-300">{error}</p>
          ) : (
            <p className="text-xs text-white/25">
              Be descriptive. Your prompt becomes your project brief.
            </p>
          )}

          <span className="text-[10px] tabular-nums text-white/25">
            {prompt.length}/500
          </span>
        </div>

        <div className="mt-14 w-full max-w-[780px]">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-[10px] tracking-[0.18em] text-white/30">
              NEED A LITTLE INSPIRATION?
            </p>

            <p className="text-[10px] text-white/20">START WITH AN IDEA</p>
          </div>

          <div className="grid grid-cols-1 gap-3 text-left sm:grid-cols-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.title}
                type="button"
                disabled={creating}
                onClick={() => selectSuggestion(suggestion.description)}
                className="forge-suggestion group rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 text-left transition hover:border-orange-200/25 hover:bg-white/[0.055]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white/75 transition group-hover:text-white">
                    {suggestion.title}
                  </span>

                  <ArrowIcon />
                </div>

                <p className="mt-2 line-clamp-2 text-xs leading-5 text-white/30">
                  {suggestion.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 flex items-center gap-3 text-[10px] tracking-[0.14em] text-white/20">
          <span className="h-px w-8 bg-white/10" />
          BUILT TO EXPLORE
          <span className="h-px w-8 bg-white/10" />
        </div>
      </section>
    </main>
  );
}
