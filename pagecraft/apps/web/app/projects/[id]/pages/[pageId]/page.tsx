import Image from "next/image";
import Link from "next/link";

import { MetricCard } from "../../../../../src/components/metric-card";
import { StatusChip } from "../../../../../src/components/status-chip";
import { getPage } from "../../../../../src/lib/api";

export default async function PageDetailPage({ params }: { params: Promise<{ id: string; pageId: string }> }) {
  const { id, pageId } = await params;
  const page = await getPage(pageId);

  return (
    <div className="space-y-6">
      <section className="panel p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Link href={`/projects/${id}`} className="text-sm font-semibold text-blue-600">
                Back to project
              </Link>
              <StatusChip value={page.status} />
            </div>
            <h2 className="mt-3 text-3xl font-semibold text-ink">{page.title ?? page.path}</h2>
            <p className="mt-2 text-sm text-slate-500">{page.url}</p>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">{page.metadata.description ?? "No metadata description captured."}</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Import from Figma plugin using project <strong className="text-ink">{id}</strong> and page <strong className="text-ink">{page.id}</strong>.
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Nodes" value={page.nodeSummary.total} detail={`${page.nodeSummary.textNodes} text / ${page.nodeSummary.imageNodes} image`} />
        <MetricCard label="Fonts" value={page.styleSummary.fontFamilies.length} detail={page.styleSummary.fontFamilies.join(", ") || "No font families"} />
        <MetricCard label="Warnings" value={page.warnings.length} detail={`${page.jobs.length} jobs recorded`} />
        <MetricCard label="Patterns" value={page.patterns.length} detail={`${page.capture?.nodes.length ?? 0} root node(s)`} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="panel overflow-hidden">
          <div className="border-b border-slate-200/80 px-6 py-4">
            <h3 className="text-lg font-semibold text-ink">Screenshot Preview</h3>
          </div>
          <div className="p-6">
            {page.screenshotUrl ? (
              <Image src={page.screenshotUrl} alt={page.title ?? page.path} width={1200} height={720} className="h-auto w-full rounded-2xl border border-slate-200" />
            ) : (
              <div className="flex h-72 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm font-semibold text-slate-400">
                No screenshot available for this page yet
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-6">
            <h3 className="text-lg font-semibold text-ink">Style Summary</h3>
            <dl className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <dt>Colors</dt>
                <dd>{page.styleSummary.colors.join(", ") || "None"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Spacing values</dt>
                <dd>{page.styleSummary.spacingValues.join(", ") || "None"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Radius values</dt>
                <dd>{page.styleSummary.radiusValues.join(", ") || "None"}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt>Shadow count</dt>
                <dd>{page.styleSummary.shadowCount}</dd>
              </div>
            </dl>
          </div>

          <div className="panel p-6">
            <h3 className="text-lg font-semibold text-ink">Warnings</h3>
            <ul className="mt-4 space-y-3">
              {page.warnings.length === 0 ? (
                <li className="text-sm text-slate-500">No warnings on this page.</li>
              ) : (
                page.warnings.map((warning) => (
                  <li key={warning.id} className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-warning">
                    <strong className="mr-2">{warning.code}</strong>
                    {warning.message}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
