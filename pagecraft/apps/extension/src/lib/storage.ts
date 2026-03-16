import { backendConfigSchema, type BackendConfig, type DiscoveredRoute, type JobReference } from "@pagecraft/shared-types";

const SYNC_KEY = "pagecraft.config";
const LOCAL_KEY = "pagecraft.localState";

export interface LocalExtensionState {
  lastDiscovery: {
    siteOrigin: string;
    tabUrl: string;
    routes: DiscoveredRoute[];
    warnings: string[];
  } | null;
}

const defaultConfig = backendConfigSchema.parse({});

const defaultLocalState: LocalExtensionState = {
  lastDiscovery: null
};

export async function getStoredConfig(): Promise<BackendConfig> {
  const stored = await chrome.storage.sync.get(SYNC_KEY);
  return backendConfigSchema.parse(stored[SYNC_KEY] ?? defaultConfig);
}

export async function saveStoredConfig(patch: Partial<BackendConfig>): Promise<BackendConfig> {
  const current = await getStoredConfig();
  const next = backendConfigSchema.parse({
    ...current,
    ...patch,
    crawlSettings: patch.crawlSettings
      ? {
          ...current.crawlSettings,
          ...patch.crawlSettings,
          filters: {
            ...current.crawlSettings.filters,
            ...patch.crawlSettings.filters
          }
        }
      : current.crawlSettings
  });

  await chrome.storage.sync.set({ [SYNC_KEY]: next });
  return next;
}

export async function getLocalState(): Promise<LocalExtensionState> {
  const stored = await chrome.storage.local.get(LOCAL_KEY);
  return (stored[LOCAL_KEY] as LocalExtensionState | undefined) ?? defaultLocalState;
}

export async function saveLastDiscovery(lastDiscovery: LocalExtensionState["lastDiscovery"]): Promise<void> {
  const current = await getLocalState();
  await chrome.storage.local.set({
    [LOCAL_KEY]: {
      ...current,
      lastDiscovery
    }
  });
}

export async function pushRecentJob(job: JobReference): Promise<BackendConfig> {
  const current = await getStoredConfig();
  const nextRecentJobs = [job, ...current.recentJobs.filter((existing) => existing.id !== job.id)].slice(0, 8);
  return saveStoredConfig({ recentJobs: nextRecentJobs });
}
