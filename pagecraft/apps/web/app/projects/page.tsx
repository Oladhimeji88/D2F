import { EmptyState } from "../../src/components/empty-state";
import { ProjectCreateForm } from "../../src/components/project-create-form";
import { ProjectCard } from "../../src/components/project-card";
import { getProjects } from "../../src/lib/api";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Projects</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold text-ink">Capture programs and import-ready exports</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              Manage site captures, crawl jobs, styles, warnings, and detected reusable patterns in one place.
            </p>
          </div>
          <p className="text-sm text-slate-500">{projects.length} total project(s)</p>
        </div>
      </section>

      <ProjectCreateForm />

      {projects.length === 0 ? (
        <EmptyState title="No projects yet" body="Create a project with a root URL to begin capturing pages and running multi-page crawls." />
      ) : (
        <section className="grid gap-5 xl:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </section>
      )}
    </div>
  );
}
