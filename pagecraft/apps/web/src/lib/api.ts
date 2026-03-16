import type {
  JobDetail,
  PageDetail,
  PageListItem,
  Pattern,
  ProjectDetail,
  ProjectListItem,
  StyleToken,
  WarningLog
} from "@pagecraft/shared-types";

function apiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const text = await response.text();
  let json: { success?: boolean; data?: unknown; error?: { message?: string } } = {};

  if (text) {
    try {
      json = JSON.parse(text) as { success?: boolean; data?: unknown; error?: { message?: string } };
    } catch {
      throw new Error(`Invalid API response for ${path}`);
    }
  }

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message ?? `Request failed for ${path}`);
  }

  return json.data as T;
}

export async function getProjects() {
  return request<ProjectListItem[]>("/projects");
}

export async function createProject(input: { name: string; rootUrl?: string; description?: string }) {
  return request<ProjectListItem>("/projects", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function getProject(projectId: string) {
  return request<ProjectDetail>(`/projects/${projectId}`);
}

export async function getPage(pageId: string) {
  return request<PageDetail>(`/pages/${pageId}`);
}

export async function startPageCapture(input: { projectId: string; url: string; title?: string; mode?: "page" | "style-guide" }) {
  return request<JobDetail>("/captures/page", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function startProjectCrawl(projectId: string, input: { rootUrl: string; settings: { maxDepth: number; maxPages: number; filters: { include: string[]; exclude: string[] } } }) {
  return request<JobDetail>(`/projects/${projectId}/crawl`, {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export async function devLogin() {
  return request<{ id: string; email: string; name: string }>("/auth/dev-login", {
    method: "POST",
    body: JSON.stringify({})
  });
}

export async function getProjectPages(projectId: string) {
  return request<PageListItem[]>(`/projects/${projectId}/pages`);
}

export async function getProjectStyles(projectId: string) {
  return request<StyleToken[]>(`/projects/${projectId}/styles`);
}

export async function getProjectPatterns(projectId: string) {
  return request<Pattern[]>(`/projects/${projectId}/patterns`);
}

export async function getProjectWarnings(projectId: string) {
  return request<WarningLog[]>(`/projects/${projectId}/warnings`);
}

export async function getProjectJobs(projectId: string) {
  return request<JobDetail[]>(`/projects/${projectId}/jobs`);
}
