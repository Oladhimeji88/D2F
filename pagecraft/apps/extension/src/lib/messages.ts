import type {
  BackendConfig,
  CrawlSettings,
  DiscoveredRoute,
  JobReference,
  ProjectSummary,
  SerializedPage
} from "@pagecraft/shared-types";

export const popupMessageTypes = {
  getUiState: "pagecraft.ui.get-state",
  saveConfig: "pagecraft.ui.save-config",
  refreshProjects: "pagecraft.ui.refresh-projects",
  captureCurrentPage: "pagecraft.ui.capture-current-page",
  discoverRoutes: "pagecraft.ui.discover-routes",
  startCrawl: "pagecraft.ui.start-crawl"
} as const;

export const contentMessageTypes = {
  ping: "pagecraft.content.ping",
  serializePage: "pagecraft.content.serialize-page",
  discoverRoutes: "pagecraft.content.discover-routes"
} as const;

export interface ExtensionUiState {
  config: BackendConfig;
  currentTab: {
    id: number | null;
    title: string;
    url: string;
  };
  projects: ProjectSummary[];
  recentJobs: JobReference[];
  lastDiscovery: {
    siteOrigin: string;
    tabUrl: string;
    routes: DiscoveredRoute[];
    warnings: string[];
  } | null;
}

export interface BackgroundOkResponse<T> {
  ok: true;
  data: T;
}

export interface BackgroundErrorResponse {
  ok: false;
  error: string;
}

export type BackgroundResponse<T> = BackgroundOkResponse<T> | BackgroundErrorResponse;

export interface SaveConfigMessage {
  type: (typeof popupMessageTypes)["saveConfig"];
  payload: Partial<BackendConfig>;
}

export interface CaptureCurrentPageMessage {
  type: (typeof popupMessageTypes)["captureCurrentPage"];
  payload: {
    mode: "page" | "style-guide";
    selectedProjectId?: string | null;
    newProjectName?: string;
  };
}

export interface DiscoverRoutesMessage {
  type: (typeof popupMessageTypes)["discoverRoutes"];
  payload: {
    settings: CrawlSettings;
  };
}

export interface StartCrawlMessage {
  type: (typeof popupMessageTypes)["startCrawl"];
  payload: {
    settings: CrawlSettings;
    selectedProjectId?: string | null;
    newProjectName?: string;
    routes?: DiscoveredRoute[];
  };
}

export type PopupMessage =
  | { type: (typeof popupMessageTypes)["getUiState"] }
  | SaveConfigMessage
  | { type: (typeof popupMessageTypes)["refreshProjects"] }
  | CaptureCurrentPageMessage
  | DiscoverRoutesMessage
  | StartCrawlMessage;

export type ContentRequest =
  | { type: (typeof contentMessageTypes)["ping"] }
  | {
      type: (typeof contentMessageTypes)["serializePage"];
      payload: { mode: "page" | "style-guide" };
    }
  | {
      type: (typeof contentMessageTypes)["discoverRoutes"];
      payload: { settings: CrawlSettings };
    };

export type ContentResponse =
  | { ok: true; data: true }
  | { ok: true; data: SerializedPage }
  | {
      ok: true;
      data: {
        siteOrigin: string;
        tabUrl: string;
        routes: DiscoveredRoute[];
        warnings: string[];
      };
    }
  | BackgroundErrorResponse;
