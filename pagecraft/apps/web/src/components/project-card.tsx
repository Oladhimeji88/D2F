import Link from "next/link";

import type { ProjectListItem } from "@pagecraft/shared-types";

import { StatusChip } from "./status-chip";

export function ProjectCard({ project }: { project: ProjectListItem }) {
  return (
    <Link href={`/projects/${project.id}`} className="panel block p-6 transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{project.slug}</p>
          <h2 className="mt-2 text-xl font-semibold text-ink">{project.name}</h2>
        </div>
        <StatusChip value={project.status} />
      </div>
      <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
        <span>{project.pageCount} pages</span>
        <span>{project.updatedAt ? `Recent activity ${new Date(project.updatedAt).toLocaleDateString()}` : "No activity yet"}</span>
      </div>
    </Link>
  );
}
