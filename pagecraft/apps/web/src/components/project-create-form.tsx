"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createProject } from "../lib/api";

export function ProjectCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [rootUrl, setRootUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const canSubmit = name.trim().length > 0 && !isPending;

  return (
    <div className="panel p-6">
      <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto]">
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none ring-0"
          placeholder="New project name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink outline-none ring-0"
          placeholder="https://example.com"
          value={rootUrl}
          onChange={(event) => setRootUrl(event.target.value)}
        />
        <button
          className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
          disabled={!canSubmit}
          onClick={() => {
            startTransition(async () => {
              try {
                setError(null);
                if (!name.trim()) {
                  setError("Enter a project name.");
                  return;
                }

                const project = await createProject({
                  name: name.trim(),
                  rootUrl: rootUrl.trim() || undefined
                });
                setName("");
                setRootUrl("");
                router.push(`/projects/${project.id}`);
                router.refresh();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Could not create project.");
              }
            });
          }}
        >
          {isPending ? "Creating..." : "Create Project"}
        </button>
      </div>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
