import { crawlSettingsSchema, type CrawlSettings, type JobReference } from "@pagecraft/shared-types";

import type { BackgroundResponse, ExtensionUiState, PopupMessage } from "./lib/messages";
import { popupMessageTypes } from "./lib/messages";
import { splitPatternList } from "./lib/url";

type StatusTone = "neutral" | "success" | "error";

const backendUrlInput = document.querySelector<HTMLInputElement>("#backend-url");
const projectSelect = document.querySelector<HTMLSelectElement>("#project-select");
const newProjectInput = document.querySelector<HTMLInputElement>("#new-project-name");
const maxDepthInput = document.querySelector<HTMLInputElement>("#max-depth");
const maxPagesInput = document.querySelector<HTMLInputElement>("#max-pages");
const includePatternsInput = document.querySelector<HTMLTextAreaElement>("#include-patterns");
const excludePatternsInput = document.querySelector<HTMLTextAreaElement>("#exclude-patterns");
const tabLabel = document.querySelector<HTMLElement>("#tab-label");
const statusLabel = document.querySelector<HTMLElement>("#status");
const routeSummary = document.querySelector<HTMLElement>("#route-summary");
const jobsList = document.querySelector<HTMLElement>("#jobs-list");
const saveConfigButton = document.querySelector<HTMLButtonElement>("#save-config");
const refreshProjectsButton = document.querySelector<HTMLButtonElement>("#refresh-projects");
const capturePageButton = document.querySelector<HTMLButtonElement>("#capture-page");
const generateStyleGuideButton = document.querySelector<HTMLButtonElement>("#generate-style-guide");
const previewRoutesButton = document.querySelector<HTMLButtonElement>("#preview-routes");
const crawlSiteButton = document.querySelector<HTMLButtonElement>("#crawl-site");

let currentState: ExtensionUiState | null = null;

function assertDom<T>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function setStatus(message: string, tone: StatusTone = "neutral") {
  const label = assertDom(statusLabel, "Missing status label.");
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

function selectedProjectPayload() {
  return {
    selectedProjectId: assertDom(projectSelect, "Missing project select.").value || null,
    newProjectName: assertDom(newProjectInput, "Missing new project input.").value.trim() || undefined
  };
}

function readSettingsFromForm(): CrawlSettings {
  return crawlSettingsSchema.parse({
    maxDepth: Number(assertDom(maxDepthInput, "Missing max depth input.").value || 2),
    maxPages: Number(assertDom(maxPagesInput, "Missing max pages input.").value || 25),
    filters: {
      include: splitPatternList(assertDom(includePatternsInput, "Missing include patterns input.").value),
      exclude: splitPatternList(assertDom(excludePatternsInput, "Missing exclude patterns input.").value)
    }
  });
}

function writeSettingsToForm(settings: CrawlSettings) {
  assertDom(maxDepthInput, "Missing max depth input.").value = String(settings.maxDepth);
  assertDom(maxPagesInput, "Missing max pages input.").value = String(settings.maxPages);
  assertDom(includePatternsInput, "Missing include patterns input.").value = settings.filters.include.join("\n");
  assertDom(excludePatternsInput, "Missing exclude patterns input.").value = settings.filters.exclude.join("\n");
}

function renderProjects(state: ExtensionUiState) {
  const select = assertDom(projectSelect, "Missing project select.");
  const options = [
    `<option value="">Create from new name</option>`,
    ...state.projects.map(
      (project) =>
        `<option value="${project.id}" ${project.id === state.config.selectedProjectId ? "selected" : ""}>${project.name}</option>`
    )
  ];

  select.innerHTML = options.join("");
}

function renderJobs(jobs: JobReference[]) {
  const list = assertDom(jobsList, "Missing jobs list.");
  if (jobs.length === 0) {
    list.innerHTML = `<li class="empty">No recent jobs yet.</li>`;
    return;
  }

  list.innerHTML = jobs
    .map(
      (job) => `
        <li class="job">
          <div class="job__top">
            <span class="job__kind">${job.kind}</span>
            <span class="job__status">${job.status}</span>
          </div>
          <div class="job__meta">${job.pageUrl ?? job.projectId}</div>
        </li>
      `
    )
    .join("");
}

function renderRouteSummary(state: ExtensionUiState) {
  const summary = assertDom(routeSummary, "Missing route summary.");
  const discovery = state.lastDiscovery;

  if (!discovery) {
    summary.innerHTML = `<p class="summary-empty">No crawl preview yet.</p>`;
    return;
  }

  const preview = discovery.routes
    .slice(0, 5)
    .map((route) => `<li>${route.pathname}</li>`)
    .join("");

  summary.innerHTML = `
    <div class="summary-metrics">
      <span>${discovery.routes.length} routes</span>
      <span>${discovery.siteOrigin}</span>
    </div>
    <ul class="summary-list">${preview}</ul>
    ${
      discovery.warnings.length > 0
        ? `<p class="summary-warning">${discovery.warnings.join(" ")}</p>`
        : ""
    }
  `;
}

function applyState(state: ExtensionUiState) {
  currentState = state;
  assertDom(backendUrlInput, "Missing backend URL input.").value = state.config.apiBaseUrl;
  assertDom(newProjectInput, "Missing new project input.").value = "";
  renderProjects(state);
  writeSettingsToForm(state.config.crawlSettings);
  renderJobs(state.recentJobs);
  renderRouteSummary(state);
  assertDom(tabLabel, "Missing tab label.").textContent = state.currentTab.url
    ? `${state.currentTab.title} • ${state.currentTab.url}`
    : "Open an http or https page to capture.";
}

async function loadState(status = "Extension ready.") {
  const state = await sendMessage<ExtensionUiState>({ type: popupMessageTypes.getUiState });
  applyState(state);
  setStatus(status, "success");
}

async function persistConfig() {
  await sendMessage({
    type: popupMessageTypes.saveConfig,
    payload: {
      apiBaseUrl: assertDom(backendUrlInput, "Missing backend URL input.").value.trim(),
      selectedProjectId: assertDom(projectSelect, "Missing project select.").value || null,
      crawlSettings: readSettingsFromForm()
    }
  });
}

async function handleCapture(mode: "page" | "style-guide") {
  await persistConfig();
  setStatus(mode === "page" ? "Capturing current page..." : "Submitting style guide capture...", "neutral");

  const job = await sendMessage<JobReference>({
    type: popupMessageTypes.captureCurrentPage,
    payload: {
      mode,
      ...selectedProjectPayload()
    }
  });

  await loadState(`Submitted ${job.kind} job ${job.id}.`);
}

async function handleDiscoverRoutes() {
  await persistConfig();
  setStatus("Discovering routes from the current page...", "neutral");
  await sendMessage({
    type: popupMessageTypes.discoverRoutes,
    payload: {
      settings: readSettingsFromForm()
    }
  });
  await loadState("Route preview updated.");
}

async function handleStartCrawl() {
  await persistConfig();
  setStatus("Starting crawl from the current site...", "neutral");
  const job = await sendMessage<JobReference>({
    type: popupMessageTypes.startCrawl,
    payload: {
      settings: readSettingsFromForm(),
      ...selectedProjectPayload()
    }
  });
  await loadState(`Submitted crawl job ${job.id}.`);
}

assertDom(saveConfigButton, "Missing save config button.").addEventListener("click", async () => {
  try {
    await persistConfig();
    setStatus("Configuration saved.", "success");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not save config.", "error");
  }
});

assertDom(refreshProjectsButton, "Missing refresh projects button.").addEventListener("click", async () => {
  try {
    await loadState("Projects refreshed.");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not refresh projects.", "error");
  }
});

assertDom(capturePageButton, "Missing capture button.").addEventListener("click", async () => {
  try {
    await handleCapture("page");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Current page capture failed.", "error");
  }
});

assertDom(generateStyleGuideButton, "Missing style guide button.").addEventListener("click", async () => {
  try {
    await handleCapture("style-guide");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Style guide capture failed.", "error");
  }
});

assertDom(previewRoutesButton, "Missing preview routes button.").addEventListener("click", async () => {
  try {
    await handleDiscoverRoutes();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Route discovery failed.", "error");
  }
});

assertDom(crawlSiteButton, "Missing crawl button.").addEventListener("click", async () => {
  try {
    await handleStartCrawl();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Crawl request failed.", "error");
  }
});

void loadState().catch((error) => {
  setStatus(error instanceof Error ? error.message : "Could not load PageCraft extension state.", "error");
});
