import type { JobDetail } from "@pagecraft/shared-types";

import { StatusChip } from "./status-chip";

export function JobList({ jobs }: { jobs: JobDetail[] }) {
  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-slate-200/80 px-6 py-4">
        <h3 className="text-lg font-semibold text-ink">Jobs</h3>
      </div>
      {jobs.length === 0 ? (
        <div className="px-6 py-8 text-sm text-slate-500">No jobs yet. Start a page capture or crawl to populate project activity.</div>
      ) : (
        <ul className="divide-y divide-slate-200/70">
          {jobs.map((job) => (
            <li key={job.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div>
                <p className="font-medium text-ink">{job.kind}</p>
                <p className="text-sm text-slate-500">{job.message ?? "No job message yet."}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold text-slate-400">{Math.round(job.progress * 100)}%</span>
                <StatusChip value={job.status} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
