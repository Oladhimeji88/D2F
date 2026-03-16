import type { JobStatus, PageStatus, ProjectStatus } from "@pagecraft/shared-types";

const tones: Record<string, string> = {
  active: "border-emerald-200 bg-emerald-50 text-success",
  completed: "border-emerald-200 bg-emerald-50 text-success",
  captured: "border-emerald-200 bg-emerald-50 text-success",
  queued: "border-slate-200 bg-slate-50 text-slate-700",
  running: "border-blue-200 bg-blue-50 text-blue-700",
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  archived: "border-slate-200 bg-slate-50 text-slate-500",
  failed: "border-red-200 bg-red-50 text-danger",
  cancelled: "border-red-200 bg-red-50 text-danger",
  warning: "border-amber-200 bg-amber-50 text-warning"
};

export function StatusChip({ value }: { value: ProjectStatus | JobStatus | PageStatus | string }) {
  return <span className={`chip ${tones[value] ?? "border-slate-200 bg-slate-50 text-slate-700"}`}>{value}</span>;
}
