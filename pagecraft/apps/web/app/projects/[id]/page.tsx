import Image from "next/image";
import Link from "next/link";

import { JobList } from "../../../src/components/job-list";
import { MetricCard } from "../../../src/components/metric-card";
import { ProjectActions } from "../../../src/components/project-actions";
import { StatusChip } from "../../../src/components/status-chip";
import { getProject } from "../../../src/lib/api";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await getProject(id);

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">{project.slug}</p>
              <StatusChip value={project.status} />
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-ink">{project.name}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">{project.description ?? "No project description yet."}</p>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500">
              <span>Root URL: {project.rootUrl ?? "Not configured"}</span>
              <span>Updated: {new Date(project.updatedAt).toLocaleString()}</span>
            </div>
          </div>
          <div className="w-full max-w-xl">
            <ProjectActions projectId={project.id} rootUrl={project.rootUrl} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Pages Captured" value={project.pagesCaptured} detail={`${project.pages.length} discovered pages`} />
        <MetricCard label="Crawl Runs" value={project.crawlRunCount} detail={`${project.patternSummary.total} patterns detected`} />
        <MetricCard label="Style Tokens" value={project.styleSummary.total} detail={`${project.styleSummary.colors} colors, ${project.styleSummary.typography} typography`} />
        <MetricCard label="Warnings" value={project.warnings.length} detail={`${project.jobs.length} jobs in the project history`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <div className="panel overflow-hidden">
            <div className="border-b border-slate-200/80 px-6 py-4">
              <h3 className="text-lg font-semibold text-ink">Pages</h3>
            </div>
            {project.pages.length === 0 ? (
              <div className="px-6 py-8 text-sm text-slate-500">No pages captured yet. Use the actions panel to capture a page or start a crawl.</div>
            ) : (
              <ul className="divide-y divide-slate-200/70">
                {project.pages.map((page) => (
                  <li key={page.id} className="grid gap-4 px-6 py-5 md:grid-cols-[140px_1fr_auto] md:items-center">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                      {page.screenshotUrl ? (
                        <Image src={page.screenshotUrl} alt={page.title ?? page.path} width={280} height={168} className="h-24 w-full object-cover" />
                      ) : (
                        <div className="flex h-24 items-center justify-center text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">No preview</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-ink">{page.title ?? page.path}</p>
                      <p className="mt-1 text-sm text-slate-500">{page.url}</p>
                      <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                        Last capture {page.lastCaptureAt ? new Date(page.lastCaptureAt).toLocaleString() : "pending"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusChip value={page.status} />
                      <Link className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700" href={`/projects/${project.id}/pages/${page.id}`}>
                        View page
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <JobList jobs={project.jobs} />
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">Detected Patterns</h3>
              <span className="text-sm text-slate-500">{project.patterns.length} total</span>
            </div>
            {project.patterns.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Patterns appear after similar structures are captured across multiple pages.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {project.patterns.map((pattern) => (
                  <div key={pattern.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{pattern.name}</p>
                      <StatusChip value={pattern.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">{pattern.description ?? "Reusable structure detected across pages."}</p>
                    <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{Math.round(pattern.confidence * 100)}% confidence</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-ink">Crawl Runs</h3>
              <span className="text-sm text-slate-500">{project.templateClusters.length} template cluster(s)</span>
            </div>
            {project.crawlRuns.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No crawl runs yet. Start a crawl to discover routes and template clusters.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {project.crawlRuns.map((run) => (
                  <div key={run.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-ink">{run.siteOrigin}</p>
                      <StatusChip value={run.status} />
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {run.visitedCount} visited / {run.discoveredCount} discovered / {run.skippedCount} skipped
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="panel p-6">
            <h3 className="text-lg font-semibold text-ink">Recent Activity</h3>
            {project.recentActivity.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                Project activity will appear here after captures or crawls run.
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {project.recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div>
                      <p className="font-medium text-ink">{activity.message}</p>
                      <p className="mt-1 text-sm text-slate-500">{new Date(activity.createdAt).toLocaleString()}</p>
                    </div>
                    <StatusChip value={activity.status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="panel p-6">
            <h3 className="text-lg font-semibold text-ink">Warnings</h3>
            {project.warnings.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">
                No warnings have been recorded for this project.
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {project.warnings.map((warning) => (
                  <li key={warning.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
                    <strong className="mr-2">{warning.code}</strong>
                    {warning.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
