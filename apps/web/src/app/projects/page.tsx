"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/auth/use-auth";

import ProjectCard from "@/components/projects/project-card";
import CreateProjectDialog from "@/components/projects/create-project-dialog";

import { createProject, deleteProject, getProjects } from "@/lib/projects";

import type { Project } from "@/types/project";

export default function ProjectsPage() {
  const router = useRouter();

  const { user, loading: authLoading, logout } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);

  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    async function loadProjects() {
      try {
        setLoading(true);
        setError(null);

        const data = await getProjects();

        console.log("GET PROJECTS: ", data);

        setProjects(data);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load projects",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, [authLoading, user, router]);

  async function handleCreateProject(name: string, description: string) {
    try {
      setCreating(true);
      setError(null);

      const project = await createProject(name, description || undefined);

      setProjects((current) => [project, ...current]);

      setCreateOpen(false);

      // Immediately open the new project.
      router.push(`/workspace/${project.id}`);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create project",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    const confirmed = window.confirm(
      "Delete this project? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError(null);

      await deleteProject(projectId);

      setProjects((current) =>
        current.filter((project) => project.id !== projectId),
      );
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to delete project",
      );
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        Restoring session...
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="font-semibold">Forge</div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-500">{user.email}</span>

            <button
              onClick={handleLogout}
              className="rounded-md px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-900 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">Projects</h1>

            <p className="mt-2 text-zinc-500">
              Build, edit and deploy your applications.
            </p>
          </div>

          <button
            onClick={() => setCreateOpen(true)}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black hover:bg-zinc-200"
          >
            + New project
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-zinc-500">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-800 py-20 text-center">
            <h2 className="text-lg font-medium">No projects yet</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Create your first project to start building.
            </p>

            <button
              onClick={() => setCreateOpen(true)}
              className="mt-6 rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-black"
            >
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>
        )}
      </div>

      <CreateProjectDialog
        open={createOpen}
        loading={creating}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateProject}
      />
    </main>
  );
}
