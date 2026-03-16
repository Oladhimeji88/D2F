import {
  backendConfigSchema,
  crawlStartRequestSchema,
  crawlSettingsSchema,
  pluginCaptureRequestSchema,
  type BackendConfig,
  type DiscoveredRoute,
  type ProjectSummary
} from "@pagecraft/shared-types";

import { PageCraftApiClient } from "./lib/api-client";
import { contentMessageTypes, popupMessageTypes, type BackgroundResponse, type ContentResponse, type PopupMessage } from "./lib/messages";
import { getLocalState, getStoredConfig, pushRecentJob, saveLastDiscovery, saveStoredConfig } from "./lib/storage";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url) {
    throw new Error("No active tab is available.");
  }

  if (!/^https?:\/\//i.test(tab.url)) {
    throw new Error("PageCraft only captures http and https pages.");
  }

  return {
    id: tab.id,
    title: tab.title ?? "Current page",
    url: tab.url
  };
}

async function ensureContentScript(tabId: number): Promise<void> {
  try {
    const ping = (await chrome.tabs.sendMessage(tabId, { type: contentMessageTypes.ping })) as ContentResponse;
    if (ping.ok) {
      return;
    }
  } catch {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content-script.js"]
    });
  }
}

async function withApiClient<T>(handler: (client: PageCraftApiClient, config: BackendConfig) => Promise<T>): Promise<T> {
  const config = backendConfigSchema.parse(await getStoredConfig());
  const client = new PageCraftApiClient(config.apiBaseUrl);
  return handler(client, config);
}

async function resolveProject(client: PageCraftApiClient, selectedProjectId?: string | null, newProjectName?: string) {
  if (selectedProjectId) {
    return selectedProjectId;
  }

  const trimmedName = newProjectName?.trim();
  if (!trimmedName) {
    throw new Error("Select a project or enter a new project name.");
  }

  const project = await client.createProject(trimmedName);
  await saveStoredConfig({ selectedProjectId: project.id });
  return project.id;
}

async function refreshProjectsAndJobs(config: BackendConfig) {
  return withApiClient(async (client) => {
    const [projects, updatedRecentJobs] = await Promise.all([
      client.listProjects(),
      Promise.all(
        config.recentJobs.map(async (job) => {
          try {
            return await client.getJob(job.id);
          } catch {
            return job;
          }
        })
      )
    ]);

    await saveStoredConfig({ recentJobs: updatedRecentJobs });
    return {
      projects,
      recentJobs: updatedRecentJobs
    };
  });
}

async function buildUiState() {
  const [config, localState, activeTab] = await Promise.all([getStoredConfig(), getLocalState(), getActiveTab().catch(() => null)]);
  const safeConfig = backendConfigSchema.parse(config);
  const refreshed = await refreshProjectsAndJobs(safeConfig).catch(() => ({
    projects: [] as ProjectSummary[],
    recentJobs: safeConfig.recentJobs
  }));

  return {
    config: {
      ...safeConfig,
      recentJobs: refreshed.recentJobs
    },
    currentTab: {
      id: activeTab?.id ?? null,
      title: activeTab?.title ?? "No active page",
      url: activeTab?.url ?? ""
    },
    projects: refreshed.projects,
    recentJobs: refreshed.recentJobs,
    lastDiscovery: localState.lastDiscovery
  };
}

async function captureCurrentPage(mode: "page" | "style-guide", selectedProjectId?: string | null, newProjectName?: string) {
  const activeTab = await getActiveTab();
  await ensureContentScript(activeTab.id);

  const contentResponse = (await chrome.tabs.sendMessage(activeTab.id, {
    type: contentMessageTypes.serializePage,
    payload: { mode }
  })) as ContentResponse;

  if (!contentResponse.ok || !isRecord(contentResponse.data) || typeof contentResponse.data.url !== "string") {
    throw new Error(contentResponse.ok ? "Invalid page payload returned by content script." : contentResponse.error);
  }

  return withApiClient(async (client) => {
    const projectId = await resolveProject(client, selectedProjectId, newProjectName);
    const job = await client.submitCurrentTabCapture(
      pluginCaptureRequestSchema.parse({
        projectId,
        mode,
        tabUrl: activeTab.url,
        page: contentResponse.data
      })
    );

    await pushRecentJob(job);
    await saveStoredConfig({ selectedProjectId: projectId });
    return job;
  });
}

async function discoverRoutes(settings: BackendConfig["crawlSettings"]) {
  const activeTab = await getActiveTab();
  await ensureContentScript(activeTab.id);

  const response = (await chrome.tabs.sendMessage(activeTab.id, {
    type: contentMessageTypes.discoverRoutes,
    payload: { settings }
  })) as ContentResponse;

  if (!response.ok || !isRecord(response.data) || !Array.isArray(response.data.routes)) {
    throw new Error(response.ok ? "Invalid route discovery payload." : response.error);
  }

  await saveLastDiscovery(response.data);
  return response.data;
}

async function startCrawl(settings: BackendConfig["crawlSettings"], selectedProjectId?: string | null, newProjectName?: string, routes?: DiscoveredRoute[]) {
  const cachedDiscovery = (await getLocalState()).lastDiscovery;
  const discovery =
    routes && cachedDiscovery
      ? {
          ...cachedDiscovery,
          routes
        }
      : await discoverRoutes(settings);

  if (!discovery) {
    throw new Error("No crawl discovery data is available.");
  }

  return withApiClient(async (client) => {
    const projectId = await resolveProject(client, selectedProjectId, newProjectName);
    const job = await client.startCrawl(
      crawlStartRequestSchema.parse({
        projectId,
        siteOrigin: discovery.siteOrigin,
        tabUrl: discovery.tabUrl,
        routes: discovery.routes,
        settings: crawlSettingsSchema.parse(settings)
      })
    );

    await pushRecentJob(job);
    await saveStoredConfig({ selectedProjectId: projectId, crawlSettings: settings });
    return job;
  });
}

function ok<T>(data: T): BackgroundResponse<T> {
  return { ok: true, data };
}

function fail(error: unknown): BackgroundResponse<never> {
  return {
    ok: false,
    error: error instanceof Error ? error.message : "Unexpected extension error."
  };
}

chrome.runtime.onInstalled.addListener(async () => {
  await saveStoredConfig({});
});

chrome.runtime.onMessage.addListener((message: PopupMessage, _sender, sendResponse) => {
  (async () => {
    switch (message.type) {
      case popupMessageTypes.getUiState:
        return ok(await buildUiState());
      case popupMessageTypes.saveConfig:
        return ok(await saveStoredConfig(message.payload));
      case popupMessageTypes.refreshProjects:
        return ok(await buildUiState());
      case popupMessageTypes.captureCurrentPage:
        return ok(
          await captureCurrentPage(message.payload.mode, message.payload.selectedProjectId, message.payload.newProjectName)
        );
      case popupMessageTypes.discoverRoutes:
        return ok(await discoverRoutes(message.payload.settings));
      case popupMessageTypes.startCrawl:
        return ok(
          await startCrawl(
            message.payload.settings,
            message.payload.selectedProjectId,
            message.payload.newProjectName,
            message.payload.routes
          )
        );
      default:
        return fail(new Error("Unsupported extension message."));
    }
  })()
    .then((response) => sendResponse(response))
    .catch((error) => sendResponse(fail(error)));

  return true;
});
