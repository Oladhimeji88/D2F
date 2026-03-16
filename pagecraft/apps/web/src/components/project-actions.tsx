"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { startPageCapture, startProjectCrawl } from "../lib/api";

export function ProjectActions({ projectId, rootUrl }: { projectId: string; rootUrl: string | null }) {
  const router = useRouter();
  const [captureUrl, setCaptureUrl] = useState(rootUrl ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const resolvedUrl = captureUrl.trim() || rootUrl?.trim() || "";

  return (
    <div className="panel flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending || !resolvedUrl}
          onClick={() =>
            startTransition(async () => {
              try {
                const job = await startPageCapture({ projectId, url: resolvedUrl, mode: "page" });
                setMessage(`Capture queued: ${job.id}`);
                router.refresh();
              } catch (caught) {
                setMessage(caught instanceof Error ? caught.message : "Capture failed.");
              }
            })
          }
        >
          Capture Page
        </button>
        <button
          className="rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={isPending || !resolvedUrl}
          onClick={() =>
            startTransition(async () => {
              try {
                const job = await startProjectCrawl(projectId, {
                  rootUrl: resolvedUrl,
                  settings: {
                    maxDepth: 2,
                    maxPages: 12,
                    filters: {
                      include: [],
                      exclude: []
                    }
                  }
                });
                setMessage(`Crawl queued: ${job.id}`);
                router.refresh();
              } catch (caught) {
                setMessage(caught instanceof Error ? caught.message : "Crawl failed.");
              }
            })
          }
        >
          Start Crawl
        </button>
        <button
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={() => router.refresh()}
        >
          Refresh
        </button>
        <button
          className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(projectId);
              setMessage("Project ID copied.");
            } catch {
              setMessage("Could not copy the project ID.");
            }
          }}
        >
          Copy Project ID
        </button>
      </div>
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
        placeholder="https://example.com/page"
        value={captureUrl}
        onChange={(event) => setCaptureUrl(event.target.value)}
      />
      {message ? <p className="text-sm text-slate-500">{message}</p> : <p className="text-sm text-slate-400">Use the project root URL or enter a specific page URL.</p>}
    </div>
  );
}
