import type {
  CrawlRunStatus,
  JobKind,
  JobStatus,
  NormalizedCapture,
  PageStatus,
  Pattern,
  ProjectStatus,
  SerializedPage,
  StyleToken,
  WarningLog
} from "@pagecraft/shared-types";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
}

export interface ProjectRecord {
  id: string;
  name: string;
  slug: string;
  status: ProjectStatus;
  description: string | null;
  rootUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PageRecord {
  id: string;
  projectId: string;
  siteId: string | null;
  url: string;
  path: string;
  title: string | null;
  status: PageStatus;
  updatedAt: string;
  createdAt: string;
  screenshotUrl: string | null;
  metadata: {
    canonicalUrl: string | null;
    description: string | null;
    lang: string | null;
  };
  lastCaptureAt: string | null;
  lastCaptureId: string | null;
}

export interface CaptureRecord {
  id: string;
  projectId: string;
  pageId: string;
  mode: "page" | "style-guide";
  source: "url" | "extension";
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  screenshotUrl: string | null;
  serializedPage: SerializedPage | null;
  normalized: NormalizedCapture | null;
}

export interface JobRecord {
  id: string;
  kind: JobKind;
  status: JobStatus;
  projectId: string;
  pageId: string | null;
  crawlRunId: string | null;
  pageUrl: string | null;
  sourceUrl: string | null;
  progress: number;
  message: string | null;
  errorMessage: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CrawlRunRecord {
  id: string;
  projectId: string;
  siteOrigin: string;
  seedUrl: string;
  status: CrawlRunStatus;
  maxDepth: number;
  maxPages: number;
  createdAt: string;
  updatedAt: string;
}

export interface CrawlRouteRecord {
  id: string;
  crawlRunId: string;
  url: string;
  pathname: string;
  depth: number;
  status: "discovered" | "queued" | "visited" | "skipped" | "failed";
  pageId: string | null;
  skipReason: string | null;
}

export interface ProjectStyleTokenRecord extends StyleToken {
  projectId: string;
  pageId: string | null;
}

export interface ProjectPatternRecord extends Pattern {
  projectId: string;
  pageIds: string[];
}

export interface ProjectWarningRecord extends WarningLog {
  projectId: string;
  pageId: string | null;
  jobId: string | null;
}

export interface StoreState {
  users: UserRecord[];
  projects: ProjectRecord[];
  pages: PageRecord[];
  captures: CaptureRecord[];
  jobs: JobRecord[];
  crawlRuns: CrawlRunRecord[];
  crawlRoutes: CrawlRouteRecord[];
  styles: ProjectStyleTokenRecord[];
  patterns: ProjectPatternRecord[];
  warnings: ProjectWarningRecord[];
}
