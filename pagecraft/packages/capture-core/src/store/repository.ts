import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { clusterPagesByTemplate } from "@pagecraft/pattern-engine";
import type {
  CreateProjectInput,
  CrawlRoute,
  DiscoveredRoute,
  JobDetail,
  NormalizedCapture,
  PageDetail,
  PageExportBundle,
  PageListItem,
  Pattern,
  ProjectDetail,
  ProjectExportBundle,
  ProjectListItem,
  WarningLog
} from "@pagecraft/shared-types";

import { createId, slugify } from "../utils/id";
import type {
  CaptureRecord,
  CrawlRouteRecord,
  CrawlRunRecord,
  JobRecord,
  PageRecord,
  ProjectPatternRecord,
  ProjectRecord,
  ProjectStyleTokenRecord,
  ProjectWarningRecord,
  StoreState,
  UserRecord
} from "./types";
import { createDemoState } from "./seed";

function defaultStateFile(): string {
  return resolve(import.meta.dirname, "../../../../.pagecraft-dev/state.json");
}

function now(): string {
  return new Date().toISOString();
}

function toProjectListItem(project: ProjectRecord, pages: PageRecord[]): ProjectListItem {
  return {
    id: project.id,
    name: project.name,
    slug: project.slug,
    status: project.status,
    pageCount: pages.length,
    updatedAt: project.updatedAt
  };
}

function toPageListItem(page: PageRecord): PageListItem {
  return {
    id: page.id,
    projectId: page.projectId,
    siteId: page.siteId,
    url: page.url,
    path: page.path,
    title: page.title,
    status: page.status,
    updatedAt: page.updatedAt,
    screenshotUrl: page.screenshotUrl,
    lastCaptureAt: page.lastCaptureAt
  };
}

function toJobDetail(job: JobRecord): JobDetail {
  return {
    id: job.id,
    kind: job.kind,
    status: job.status,
    projectId: job.projectId,
    pageUrl: job.pageUrl ?? undefined,
    createdAt: job.createdAt,
    pageId: job.pageId,
    crawlRunId: job.crawlRunId,
    progress: job.progress,
    message: job.message,
    errorMessage: job.errorMessage,
    updatedAt: job.updatedAt
  };
}

function styleSummary(styles: ProjectStyleTokenRecord[]) {
  return {
    total: styles.length,
    colors: styles.filter((style) => style.kind === "color").length,
    typography: styles.filter((style) => style.kind === "typography").length,
    spacing: styles.filter((style) => style.kind === "spacing").length,
    radius: styles.filter((style) => style.kind === "radius").length,
    shadow: styles.filter((style) => style.kind === "shadow").length
  };
}

function patternSummary(patterns: ProjectPatternRecord[]) {
  return {
    total: patterns.length,
    buttons: patterns.filter((pattern) => pattern.kind === "button").length,
    cards: patterns.filter((pattern) => pattern.kind === "card").length,
    navigation: patterns.filter((pattern) => pattern.kind === "navigation" || pattern.kind === "footer").length,
    inputs: patterns.filter((pattern) => pattern.kind === "input").length,
    generic: patterns.filter((pattern) => pattern.kind === "generic").length
  };
}

function activityForProject(state: StoreState, projectId: string) {
  return state.jobs
    .filter((job) => job.projectId === projectId)
    .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
    .slice(0, 6)
    .map((job) => ({
      id: job.id,
      kind: job.kind === "crawl" ? ("crawl" as const) : ("capture" as const),
      message: job.message ?? `${job.kind} job ${job.status}`,
      createdAt: job.createdAt,
      status: job.status
    }));
}

function nodeSummary(capture: NormalizedCapture | null) {
  if (!capture) {
    return {
      total: 0,
      textNodes: 0,
      imageNodes: 0,
      vectorNodes: 0,
      maxDepth: 0
    };
  }

  let total = 0;
  let textNodes = 0;
  let imageNodes = 0;
  let vectorNodes = 0;
  let maxDepth = 0;

  const visit = (nodes: NormalizedCapture["nodes"], depth: number) => {
    maxDepth = Math.max(maxDepth, depth);
    for (const node of nodes) {
      total += 1;
      if (node.type === "text") {
        textNodes += 1;
      }

      if (node.type === "image") {
        imageNodes += 1;
      }

      if (node.type === "vector") {
        vectorNodes += 1;
      }

      visit(node.children, depth + 1);
    }
  };

  visit(capture.nodes, 1);
  return { total, textNodes, imageNodes, vectorNodes, maxDepth };
}

function pageStyleSummary(styles: ProjectStyleTokenRecord[]) {
  const fontFamilies = new Set<string>();
  const spacingValues = new Set<number>();
  const radiusValues = new Set<number>();

  for (const style of styles) {
    if (style.kind === "typography" && typeof style.value === "object" && style.value !== null) {
      const record = style.value as Record<string, unknown>;
      if (typeof record.fontFamily === "string") {
        fontFamilies.add(record.fontFamily);
      }
    }

    if (style.kind === "spacing" && typeof style.value === "number") {
      spacingValues.add(style.value);
    }

    if (style.kind === "radius" && typeof style.value === "number") {
      radiusValues.add(style.value);
    }
  }

  return {
    colors: styles.filter((style) => style.kind === "color").map((style) => String(style.value)),
    fontFamilies: [...fontFamilies],
    spacingValues: [...spacingValues].sort((left, right) => left - right),
    radiusValues: [...radiusValues].sort((left, right) => left - right),
    shadowCount: styles.filter((style) => style.kind === "shadow").length
  };
}

export class LocalStoreRepository {
  constructor(private readonly stateFile = process.env.PAGECRAFT_STATE_FILE ?? defaultStateFile()) {}

  // In-process async mutex: all mutate() calls are serialised through this chain
  private lockChain: Promise<unknown> = Promise.resolve();

  private async ensureState(): Promise<StoreState> {
    try {
      const contents = await readFile(this.stateFile, "utf8");
      return JSON.parse(contents) as StoreState;
    } catch {
      const seeded = createDemoState();
      await this.writeState(seeded);
      return seeded;
    }
  }

  private async writeState(state: StoreState): Promise<void> {
    await mkdir(dirname(this.stateFile), { recursive: true });
    await writeFile(this.stateFile, JSON.stringify(state, null, 2), "utf8");
  }

  private async mutate<T>(mutator: (state: StoreState) => T | Promise<T>): Promise<T> {
    // Enqueue behind any in-flight mutate so reads and writes are serialised
    const result = this.lockChain.then(async () => {
      const state = await this.ensureState();
      const value = await mutator(state);
      await this.writeState(state);
      return value;
    });
    // Always advance the chain even if this mutate throws
    this.lockChain = result.catch(() => {});
    return result;
  }

  async getCurrentUser(): Promise<UserRecord> {
    const state = await this.ensureState();
    return state.users[0] ?? {
      id: "user_demo",
      email: "demo@pagecraft.dev",
      name: "PageCraft Demo"
    };
  }

  async upsertDevUser(email: string, name: string): Promise<UserRecord> {
    return this.mutate((state) => {
      const existing = state.users.find((user) => user.email === email);
      if (existing) {
        existing.name = name;
        return existing;
      }

      const user = {
        id: createId("user"),
        email,
        name
      };
      state.users.unshift(user);
      return user;
    });
  }

  async listProjects(): Promise<ProjectListItem[]> {
    const state = await this.ensureState();
    return state.projects.map((project) => toProjectListItem(project, state.pages.filter((page) => page.projectId === project.id)));
  }

  async getProjectRecord(projectId: string): Promise<ProjectRecord | null> {
    const state = await this.ensureState();
    return state.projects.find((project) => project.id === projectId) ?? null;
  }

  async createProject(input: CreateProjectInput): Promise<ProjectRecord> {
    return this.mutate((state) => {
      const timestamp = now();
      const project: ProjectRecord = {
        id: createId("project"),
        name: input.name,
        slug: slugify(input.name),
        status: "active",
        description: input.description ?? null,
        rootUrl: input.rootUrl ?? null,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      state.projects.unshift(project);
      return project;
    });
  }

  async deleteProject(projectId: string): Promise<boolean> {
    return this.mutate((state) => {
      const initialCount = state.projects.length;
      state.projects = state.projects.filter((project) => project.id !== projectId);
      state.pages = state.pages.filter((page) => page.projectId !== projectId);
      state.captures = state.captures.filter((capture) => capture.projectId !== projectId);
      state.jobs = state.jobs.filter((job) => job.projectId !== projectId);
      state.crawlRuns = state.crawlRuns.filter((crawlRun) => crawlRun.projectId !== projectId);
      const crawlRunIds = new Set(state.crawlRuns.map((crawlRun) => crawlRun.id));
      state.crawlRoutes = state.crawlRoutes.filter((route) => crawlRunIds.has(route.crawlRunId));
      state.styles = state.styles.filter((style) => style.projectId !== projectId);
      state.patterns = state.patterns.filter((pattern) => pattern.projectId !== projectId);
      state.warnings = state.warnings.filter((warning) => warning.projectId !== projectId);
      return initialCount !== state.projects.length;
    });
  }

  async listPages(projectId: string): Promise<PageListItem[]> {
    const state = await this.ensureState();
    return state.pages.filter((page) => page.projectId === projectId).map(toPageListItem);
  }

  async getOrCreatePage(projectId: string, url: string, title?: string): Promise<PageRecord> {
    return this.mutate((state) => {
      const existing = state.pages.find((page) => page.projectId === projectId && page.url === url);
      if (existing) {
        if (title) {
          existing.title = title;
        }
        existing.updatedAt = now();
        return existing;
      }

      const parsed = new URL(url);
      const timestamp = now();
      const page: PageRecord = {
        id: createId("page"),
        projectId,
        siteId: null,
        url,
        path: parsed.pathname || "/",
        title: title ?? (parsed.pathname || url),
        status: "queued",
        createdAt: timestamp,
        updatedAt: timestamp,
        screenshotUrl: null,
        metadata: {
          canonicalUrl: url,
          description: null,
          lang: null
        },
        lastCaptureAt: null,
        lastCaptureId: null
      };
      state.pages.unshift(page);
      return page;
    });
  }

  async getPageRecord(pageId: string): Promise<PageRecord | null> {
    const state = await this.ensureState();
    return state.pages.find((page) => page.id === pageId) ?? null;
  }

  async getLatestCapture(pageId: string): Promise<CaptureRecord | null> {
    const state = await this.ensureState();
    return state.captures
      .filter((capture) => capture.pageId === pageId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0] ?? null;
  }

  async listCapturesByProject(projectId: string): Promise<CaptureRecord[]> {
    const state = await this.ensureState();
    return state.captures.filter((capture) => capture.projectId === projectId);
  }

  async createJob(job: Omit<JobRecord, "id" | "createdAt" | "updatedAt">): Promise<JobRecord> {
    return this.mutate((state) => {
      const timestamp = now();
      const record: JobRecord = {
        ...job,
        id: createId("job"),
        createdAt: timestamp,
        updatedAt: timestamp
      };
      state.jobs.unshift(record);
      return record;
    });
  }

  async updateJob(jobId: string, patch: Partial<JobRecord>): Promise<JobRecord | null> {
    return this.mutate((state) => {
      const job = state.jobs.find((entry) => entry.id === jobId);
      if (!job) {
        return null;
      }

      Object.assign(job, patch, { updatedAt: now() });
      return job;
    });
  }

  async listJobs(projectId?: string): Promise<JobDetail[]> {
    const state = await this.ensureState();
    return state.jobs
      .filter((job) => (projectId ? job.projectId === projectId : true))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(toJobDetail);
  }

  async getJob(jobId: string): Promise<JobDetail | null> {
    const state = await this.ensureState();
    const job = state.jobs.find((entry) => entry.id === jobId);
    return job ? toJobDetail(job) : null;
  }

  async listQueuedJobs(): Promise<JobRecord[]> {
    const state = await this.ensureState();
    return state.jobs.filter((job) => job.status === "queued");
  }

  async createCaptureRecord(record: Omit<CaptureRecord, "id" | "createdAt" | "updatedAt">): Promise<CaptureRecord> {
    return this.mutate((state) => {
      const timestamp = now();
      const capture: CaptureRecord = {
        ...record,
        id: createId("capture"),
        createdAt: timestamp,
        updatedAt: timestamp
      };
      state.captures.unshift(capture);
      return capture;
    });
  }

  async completeCaptureResult(
    captureId: string,
    result: {
      normalized: NormalizedCapture;
      screenshotUrl: string | null;
      styles: ProjectStyleTokenRecord[];
      warnings: ProjectWarningRecord[];
      pageTitle: string | null;
      pageMetadata?: PageRecord["metadata"];
    }
  ): Promise<void> {
    await this.mutate((state) => {
      const capture = state.captures.find((entry) => entry.id === captureId);
      if (!capture) {
        return;
      }

      capture.normalized = result.normalized;
      capture.screenshotUrl = result.screenshotUrl;
      capture.status = "completed";
      capture.updatedAt = now();

      const page = state.pages.find((entry) => entry.id === capture.pageId);
      if (page) {
        page.status = "captured";
        page.title = result.pageTitle ?? page.title;
        page.screenshotUrl = result.screenshotUrl;
        page.lastCaptureId = capture.id;
        page.lastCaptureAt = capture.updatedAt;
        page.updatedAt = capture.updatedAt;
        if (result.pageMetadata) {
          page.metadata = result.pageMetadata;
        }
      }

      state.styles = [...state.styles.filter((style) => !(style.projectId === capture.projectId && style.pageId === capture.pageId)), ...result.styles];
      state.warnings = [...state.warnings.filter((warning) => !(warning.projectId === capture.projectId && warning.pageId === capture.pageId)), ...result.warnings];
    });
  }

  async replaceProjectPatterns(projectId: string, patterns: ProjectPatternRecord[]): Promise<void> {
    await this.mutate((state) => {
      state.patterns = [...state.patterns.filter((pattern) => pattern.projectId !== projectId), ...patterns];
    });
  }

  async createCrawlRun(projectId: string, rootUrl: string, maxDepth: number, maxPages: number): Promise<CrawlRunRecord> {
    return this.mutate((state) => {
      const timestamp = now();
      const crawlRun: CrawlRunRecord = {
        id: createId("crawl"),
        projectId,
        siteOrigin: new URL(rootUrl).origin,
        seedUrl: rootUrl,
        status: "queued",
        maxDepth,
        maxPages,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      state.crawlRuns.unshift(crawlRun);
      return crawlRun;
    });
  }

  async updateCrawlRun(crawlRunId: string, patch: Partial<CrawlRunRecord>): Promise<CrawlRunRecord | null> {
    return this.mutate((state) => {
      const crawlRun = state.crawlRuns.find((entry) => entry.id === crawlRunId);
      if (!crawlRun) {
        return null;
      }

      Object.assign(crawlRun, patch, { updatedAt: now() });
      return crawlRun;
    });
  }

  async getCrawlRun(crawlRunId: string): Promise<CrawlRunRecord | null> {
    const state = await this.ensureState();
    return state.crawlRuns.find((run) => run.id === crawlRunId) ?? null;
  }

  async queueCrawlRoutes(crawlRunId: string, routes: DiscoveredRoute[]): Promise<CrawlRouteRecord[]> {
    return this.mutate((state) => {
      const existing = new Set(state.crawlRoutes.filter((route) => route.crawlRunId === crawlRunId).map((route) => route.url));
      const created: CrawlRouteRecord[] = [];

      for (const route of routes) {
        if (existing.has(route.url)) {
          continue;
        }

        const record: CrawlRouteRecord = {
          id: createId("route"),
          crawlRunId,
          url: route.url,
          pathname: route.pathname,
          depth: route.depth,
          status: "queued",
          pageId: null,
          skipReason: route.skippedReason
        };
        state.crawlRoutes.push(record);
        created.push(record);
      }

      return created;
    });
  }

  async updateCrawlRoute(routeId: string, patch: Partial<CrawlRouteRecord>): Promise<CrawlRouteRecord | null> {
    return this.mutate((state) => {
      const route = state.crawlRoutes.find((entry) => entry.id === routeId);
      if (!route) {
        return null;
      }

      Object.assign(route, patch);
      return route;
    });
  }

  async listCrawlRuns(projectId: string) {
    const state = await this.ensureState();
    return state.crawlRuns
      .filter((run) => run.projectId === projectId)
      .map((run) => {
        const routes = state.crawlRoutes.filter((route) => route.crawlRunId === run.id);
        const warnings = state.warnings.filter((warning) => warning.projectId === projectId && warning.jobId === run.id);
        return {
          id: run.id,
          projectId: run.projectId,
          siteOrigin: run.siteOrigin,
          seedUrl: run.seedUrl,
          status: run.status,
          maxDepth: run.maxDepth,
          maxPages: run.maxPages,
          createdAt: run.createdAt,
          updatedAt: run.updatedAt,
          discoveredCount: routes.length,
          visitedCount: routes.filter((route) => route.status === "visited").length,
          skippedCount: routes.filter((route) => route.status === "skipped").length,
          warningsCount: warnings.length
        };
      });
  }

  async listCrawlRoutes(crawlRunId: string): Promise<CrawlRoute[]> {
    const state = await this.ensureState();
    return state.crawlRoutes
      .filter((route) => route.crawlRunId === crawlRunId)
      .map((route) => ({
        id: route.id,
        crawlRunId: route.crawlRunId,
        url: route.url,
        pathname: route.pathname,
        depth: route.depth,
        status: route.status,
        pageId: route.pageId,
        skipReason: route.skipReason
      }));
  }

  async listStyles(projectId: string): Promise<ProjectStyleTokenRecord[]> {
    const state = await this.ensureState();
    return state.styles.filter((style) => style.projectId === projectId);
  }

  async listPatterns(projectId: string): Promise<ProjectPatternRecord[]> {
    const state = await this.ensureState();
    return state.patterns.filter((pattern) => pattern.projectId === projectId);
  }

  async listWarnings(projectId: string): Promise<ProjectWarningRecord[]> {
    const state = await this.ensureState();
    return state.warnings.filter((warning) => warning.projectId === projectId);
  }

  async getProjectDetail(projectId: string): Promise<ProjectDetail | null> {
    const state = await this.ensureState();
    const project = state.projects.find((entry) => entry.id === projectId);
    if (!project) {
      return null;
    }

    const pages = state.pages.filter((page) => page.projectId === projectId).map(toPageListItem);
    const styles = state.styles.filter((style) => style.projectId === projectId);
    const patterns = state.patterns.filter((pattern) => pattern.projectId === projectId);
    const warnings = state.warnings.filter((warning) => warning.projectId === projectId);
    const jobs = state.jobs.filter((job) => job.projectId === projectId).map(toJobDetail);
    const crawlRuns = await this.listCrawlRuns(projectId);
    const templateClusters = clusterPagesByTemplate(
      state.captures
        .filter((capture) => capture.projectId === projectId)
        .map((capture) => capture.normalized)
        .filter((capture): capture is NonNullable<typeof capture> => Boolean(capture))
    );

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      status: project.status,
      rootUrl: project.rootUrl,
      description: project.description,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      pagesCaptured: pages.filter((page) => page.status === "captured").length,
      captureCount: state.captures.filter((capture) => capture.projectId === projectId).length,
      jobCount: jobs.length,
      crawlRunCount: crawlRuns.length,
      latestScreenshotUrl: pages.find((page) => page.screenshotUrl)?.screenshotUrl ?? null,
      styleSummary: styleSummary(styles),
      patternSummary: patternSummary(patterns),
      recentActivity: activityForProject(state, projectId),
      pages,
      crawlRuns,
      templateClusters,
      jobs,
      warnings,
      patterns,
      styles
    };
  }

  async getPageDetail(pageId: string): Promise<PageDetail | null> {
    const state = await this.ensureState();
    const page = state.pages.find((entry) => entry.id === pageId);
    if (!page) {
      return null;
    }

    const project = state.projects.find((entry) => entry.id === page.projectId);
    const capture = state.captures
      .filter((entry) => entry.pageId === pageId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
    const styles = state.styles.filter((style) => style.projectId === page.projectId && (style.pageId === pageId || style.pageId === null));
    const patterns = state.patterns.filter((pattern) => pattern.projectId === page.projectId && pattern.pageIds.includes(pageId));
    const warnings = state.warnings.filter((warning) => warning.projectId === page.projectId && (warning.pageId === pageId || warning.pageId === null));
    const jobs = state.jobs.filter((job) => job.projectId === page.projectId && job.pageId === pageId).map(toJobDetail);

    return {
      ...toPageListItem(page),
      projectName: project?.name ?? page.projectId,
      metadata: page.metadata,
      styleSummary: pageStyleSummary(styles),
      nodeSummary: nodeSummary(capture?.normalized ?? null),
      warnings,
      capture: capture?.normalized ?? null,
      styles,
      patterns,
      jobs
    };
  }

  async buildProjectExport(projectId: string): Promise<ProjectExportBundle | null> {
    const detail = await this.getProjectDetail(projectId);
    if (!detail) {
      return null;
    }

    return {
      project: {
        id: detail.id,
        name: detail.name,
        slug: detail.slug,
        status: detail.status,
        description: detail.description
      },
      pages: detail.pages,
      styles: detail.styles,
      patterns: detail.patterns,
      warnings: detail.warnings,
      assets: detail.pages
        .filter((page) => page.screenshotUrl)
        .map((page) => ({
          id: `asset_${page.id}`,
          url: page.screenshotUrl ?? "",
          mimeType: "image/svg+xml",
          width: 1200,
          height: 720,
          storageKey: null
        })),
      generatedAt: now()
    };
  }

  async buildPageExport(pageId: string): Promise<PageExportBundle | null> {
    const state = await this.ensureState();
    const page = await this.getPageDetail(pageId);
    if (!page) {
      return null;
    }

    const project = state.projects.find((entry) => entry.id === page.projectId);
    return {
      project: {
        id: page.projectId,
        name: project?.name ?? page.projectId,
        slug: project?.slug ?? page.projectId,
        status: project?.status ?? "active",
        description: project?.description ?? null
      },
      page: {
        id: page.id,
        projectId: page.projectId,
        siteId: page.siteId,
        url: page.url,
        path: page.path,
        title: page.title,
        status: page.status,
        updatedAt: page.updatedAt,
        screenshotUrl: page.screenshotUrl,
        lastCaptureAt: page.lastCaptureAt
      },
      capture: page.capture ?? {
        id: createId("capture"),
        pageId: page.id,
        url: page.url,
        title: page.title,
        viewport: { width: 1440, height: 1024 },
        nodes: [],
        warnings: [],
        capturedAt: null
      },
      styles: page.styles,
      patterns: page.patterns,
      warnings: page.warnings,
      assets: page.screenshotUrl
        ? [
            {
              id: `asset_${page.id}`,
              url: page.screenshotUrl,
              mimeType: "image/svg+xml",
              width: 1200,
              height: 720,
              storageKey: null
            }
          ]
        : [],
      generatedAt: now()
    };
  }
}
