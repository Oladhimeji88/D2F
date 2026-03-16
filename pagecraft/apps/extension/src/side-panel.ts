import { crawlSettingsSchema, type CrawlSettings, type DiscoveredRoute, type JobReference } from "@pagecraft/shared-types";

import type { BackgroundResponse, ExtensionUiState, PopupMessage } from "./lib/messages";
import { popupMessageTypes } from "./lib/messages";

const routeList = document.querySelector<HTMLElement>("#route-list");
const refreshButton = document.querySelector<HTMLButtonElement>("#refresh-routes");
const startButton = document.querySelector<HTMLButtonElement>("#start-selected-crawl");
const statusLabel = document.querySelector<HTMLElement>("#side-status");
const projectLabel = document.querySelector<HTMLElement>("#side-project");
const metricsLabel = document.querySelector<HTMLElement>("#side-metrics");

let currentState: ExtensionUiState | null = null;

function assertDom<T>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function setStatus(message: string, tone: "neutral" | "success" | "error" = "neutral") {
  const label = assertDom(statusLabel, "Missing side panel status.");
  label.textContent = message;
  label.dataset.tone = tone;
}

async function sendMessage<T>(message: PopupMessage): Promise<T> {
  const response = (await chrome.runtime.sendMessage(message)) as BackgroundResponse<T>;
  if (!response.ok) {
    throw new Error(response.error);
  }

  return response.data;
}

function renderRoutes(routes: DiscoveredRoute[]) {
  const list = assertDom(routeList, "Missing route list.");
  if (routes.length === 0) {
    list.innerHTML = `<li class="empty">No routes discovered yet.</li>`;
    return;
  }

  list.innerHTML = routes
    .map(
      (route, index) => `
        <li class="route">
          <label>
            <input type="checkbox" data-index="${index}" checked />
            <span>
              <strong>${route.pathname}</strong>
              <small>${route.url}</small>
            </span>
          </label>
        </li>
      `
    )
    .join("");
}

function currentSettings(): CrawlSettings {
  return crawlSettingsSchema.parse(currentState?.config.crawlSettings ?? {});
}

function applyState(state: ExtensionUiState) {
  currentState = state;
  assertDom(projectLabel, "Missing project label.").textContent = state.config.selectedProjectId
    ? `Project: ${state.projects.find((project) => project.id === state.config.selectedProjectId)?.name ?? state.config.selectedProjectId}`
    : "Project: choose one in the popup";

  const routes = state.lastDiscovery?.routes ?? [];
  assertDom(metricsLabel, "Missing metrics label.").textContent = routes.length > 0 ? `${routes.length} routes ready` : "No route preview loaded";
  renderRoutes(routes);
}

async function loadState(status = "Route selector ready.") {
  const state = await sendMessage<ExtensionUiState>({ type: popupMessageTypes.getUiState });
  applyState(state);
  setStatus(status, "success");
}

async function refreshRoutes() {
  setStatus("Refreshing route candidates from the active tab...", "neutral");
  await sendMessage({
    type: popupMessageTypes.discoverRoutes,
    payload: {
      settings: currentSettings()
    }
  });
  await loadState("Route preview refreshed.");
}

function selectedRoutes(): DiscoveredRoute[] {
  const routes = currentState?.lastDiscovery?.routes ?? [];
  const checkboxes = Array.from(document.querySelectorAll<HTMLInputElement>('#route-list input[type="checkbox"]'));

  return checkboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => routes[Number(checkbox.dataset.index)])
    .filter((route): route is DiscoveredRoute => Boolean(route));
}

async function startSelectedCrawl() {
  setStatus("Submitting crawl for selected routes...", "neutral");
  const job = await sendMessage<JobReference>({
    type: popupMessageTypes.startCrawl,
    payload: {
      settings: currentSettings(),
      selectedProjectId: currentState?.config.selectedProjectId ?? null,
      routes: selectedRoutes()
    }
  });
  await loadState(`Submitted crawl job ${job.id}.`);
}

assertDom(refreshButton, "Missing refresh routes button.").addEventListener("click", async () => {
  try {
    await refreshRoutes();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Route refresh failed.", "error");
  }
});

assertDom(startButton, "Missing crawl start button.").addEventListener("click", async () => {
  try {
    await startSelectedCrawl();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Selected crawl failed.", "error");
  }
});

void loadState().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load side panel state.", "error");
});
