"use client";

import { useRouter } from "next/navigation";

import type { Project } from "@/types/project";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const router = useRouter();

  function openProject() {
    router.push(`/workspace/${project.id}`);
  }

  return (
    <div className="group rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <button onClick={openProject} className="min-w-0 text-left">
          <h2 className="truncate font-semibold text-zinc-100">
            {project.name}
          </h2>

          <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
            {project.description || "No description"}
          </p>
        </button>

        <button
          onClick={() => onDelete(project.id)}
          className="ml-4 rounded-md px-2 py-1 text-sm text-zinc-600 opacity-0 transition hover:bg-red-950 hover:text-red-400 group-hover:opacity-100"
        >
          Delete
        </button>
      </div>

      <div className="mt-5 text-xs text-zinc-600">
        Updated {new Date(project.updatedAt).toLocaleDateString()}
      </div>
    </div>
  );
}
