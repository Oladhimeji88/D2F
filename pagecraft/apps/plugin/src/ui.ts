import { pluginSavedSettingsSchema, type PageListItem, type PluginSavedSettings, type ProjectListItem } from "@pagecraft/shared-types";

import { PageCraftPluginApiClient } from "./backend-client";
import type { PluginToUiMessage } from "./messages";

type Screen = "settings" | "progress" | "result";

interface PreviewState {
  styles: number;
  patterns: number;
  warnings: number;
}

interface UiState {
  settings: PluginSavedSettings;
  projects: ProjectListItem[];
  pages: PageListItem[];
  preview: PreviewState;
}

const state: UiState = {
  settings: pluginSavedSettingsSchema.parse({}),
  projects: [],
  pages: [],
  preview: {
    styles: 0,
    patterns: 0,
    warnings: 0
  }
};

const elements = {
  settingsScreen: document.querySelector<HTMLElement>("#screen-settings"),
  progressScreen: document.querySelector<HTMLElement>("#screen-progress"),
  resultScreen: document.querySelector<HTMLElement>("#screen-result"),
  backendUrl: document.querySelector<HTMLInputElement>("#backend-url"),
  projectSelect: document.querySelector<HTMLSelectElement>("#project-select"),
  pageSelect: document.querySelector<HTMLSelectElement>("#page-select"),
  modeSelect: document.querySelector<HTMLSelectElement>("#import-mode"),
  includeImages: document.querySelector<HTMLInputElement>("#include-images"),
  createComponents: document.querySelector<HTMLInputElement>("#create-components"),
  createVariables: document.querySelector<HTMLInputElement>("#create-variables"),
  previewStats: document.querySelector<HTMLElement>("#preview-stats"),
  status: document.querySelector<HTMLElement>("#status"),
  progressBar: document.querySelector<HTMLElement>("#progress-bar"),
  progressLabel: document.querySelector<HTMLElement>("#progress-label"),
  progressDetail: document.querySelector<HTMLElement>("#progress-detail"),
  resultSummary: document.querySelector<HTMLElement>("#result-summary"),
  warningsList: document.querySelector<HTMLElement>("#warnings-list"),
  loadProjectsButton: document.querySelector<HTMLButtonElement>("#load-projects"),
  importButton: document.querySelector<HTMLButtonElement>("#import-button"),
  importAgainButton: document.querySelector<HTMLButtonElement>("#import-again"),
  closeButton: document.querySelector<HTMLButtonElement>("#close-plugin")
};

function assertDom<T>(value: T | null, message: string): T {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

function postMessage(message: unknown) {
  parent.postMessage({ pluginMessage: message }, "*");
}

function switchScreen(screen: Screen) {
  const screens: Record<Screen, HTMLElement> = {
    settings: assertDom(elements.settingsScreen, "Missing settings screen."),
    progress: assertDom(elements.progressScreen, "Missing progress screen."),
    result: assertDom(elements.resultScreen, "Missing result screen.")
  };

  for (const [key, element] of Object.entries(screens)) {
    element.hidden = key !== screen;
  }
}

function setStatus(message: string, tone: "neutral" | "success" | "error" = "neutral") {
  const status = assertDom(elements.status, "Missing status element.");
  status.textContent = message;
  status.dataset.tone = tone;
}

function client(): PageCraftPluginApiClient {
  return new PageCraftPluginApiClient(state.settings.apiBaseUrl);
}

function readSettingsFromForm(): PluginSavedSettings {
  const nextSettings = pluginSavedSettingsSchema.parse({
    apiBaseUrl: assertDom(elements.backendUrl, "Missing backend URL field.").value.trim(),
    selectedProjectId: assertDom(elements.projectSelect, "Missing project select.").value || null,
    selectedPageId: assertDom(elements.pageSelect, "Missing page select.").value || null,
    importMode: assertDom(elements.modeSelect, "Missing mode select.").value,
    options: {
      includeImages: assertDom(elements.includeImages, "Missing include images toggle.").checked,
      createComponents: assertDom(elements.createComponents, "Missing create components toggle.").checked,
      createVariables: assertDom(elements.createVariables, "Missing create variables toggle.").checked
    }
  });

  state.settings = nextSettings;
  return nextSettings;
}

function writeSettingsToForm(settings: PluginSavedSettings) {
  assertDom(elements.backendUrl, "Missing backend URL field.").value = settings.apiBaseUrl;
  assertDom(elements.modeSelect, "Missing mode select.").value = settings.importMode;
  assertDom(elements.includeImages, "Missing include images toggle.").checked = settings.options.includeImages;
  assertDom(elements.createComponents, "Missing create components toggle.").checked = settings.options.createComponents;
  assertDom(elements.createVariables, "Missing create variables toggle.").checked = settings.options.createVariables;
}

function renderProjects() {
  const select = assertDom(elements.projectSelect, "Missing project select.");
  select.innerHTML = [
    `<option value="">Choose a project</option>`,
    ...state.projects.map(
      (project) =>
        `<option value="${project.id}" ${project.id === state.settings.selectedProjectId ? "selected" : ""}>${project.name}</option>`
    )
  ].join("");
}

function renderPages() {
  const select = assertDom(elements.pageSelect, "Missing page select.");
  select.innerHTML = [
    `<option value="">Choose a page</option>`,
    ...state.pages.map(
      (page) =>
        `<option value="${page.id}" ${page.id === state.settings.selectedPageId ? "selected" : ""}>${page.title ?? page.path}</option>`
    )
  ].join("");
}

function renderPreview() {
  const previewStats = assertDom(elements.previewStats, "Missing preview stats.");
  previewStats.innerHTML = `
    <div class="stat">
      <strong>${state.preview.styles}</strong>
      <span>styles</span>
    </div>
    <div class="stat">
      <strong>${state.preview.patterns}</strong>
      <span>patterns</span>
    </div>
    <div class="stat">
      <strong>${state.preview.warnings}</strong>
      <span>warnings</span>
    </div>
  `;
}

async function hydrateSettings(settings: PluginSavedSettings) {
  state.settings = settings;
  writeSettingsToForm(settings);
  renderProjects();
  renderPages();
  renderPreview();
}

async function loadProjects() {
  const settings = readSettingsFromForm();
  postMessage({
    type: "preferences:save",
    payload: settings
  });

  setStatus("Loading projects from backend...", "neutral");
  state.projects = await client().listProjects();
  renderProjects();
  setStatus(`Loaded ${state.projects.length} projects.`, "success");
}

async function loadPagesAndPreview(projectId: string) {
  if (!projectId) {
    state.pages = [];
    state.preview = { styles: 0, patterns: 0, warnings: 0 };
    renderPages();
    renderPreview();
    return;
  }

  setStatus("Loading pages, styles, patterns, and warnings...", "neutral");
  const [pages, styles, patterns, warnings] = await Promise.all([
    client().listPages(projectId),
    client().getStyles(projectId),
    client().getPatterns(projectId),
    client().getWarnings(projectId)
  ]);

  state.pages = pages;
  state.preview = {
    styles: styles.length,
    patterns: patterns.length,
    warnings: warnings.length
  };

  renderPages();
  renderPreview();
  setStatus(`Project preview loaded for ${pages.length} pages.`, "success");
}

function updateProgress(progress: number, label: string, detail: string) {
  const progressBar = assertDom(elements.progressBar, "Missing progress bar.");
  const progressLabel = assertDom(elements.progressLabel, "Missing progress label.");
  const progressDetail = assertDom(elements.progressDetail, "Missing progress detail.");

  progressBar.style.width = `${Math.round(progress * 100)}%`;
  progressLabel.textContent = `${Math.round(progress * 100)}%`;
  progressDetail.textContent = `${label} ${detail}`.trim();
}

async function handleImport() {
  const settings = readSettingsFromForm();

  if (!settings.selectedProjectId) {
    throw new Error("Choose a project before importing.");
  }

  if (settings.importMode !== "style-guide-only" && !settings.selectedPageId) {
    throw new Error("Choose a page or switch to Style Guide Only mode.");
  }

  postMessage({
    type: "preferences:save",
    payload: settings
  });

  switchScreen("progress");
  updateProgress(0.08, "Fetching export bundles.", "Preparing backend data.");
  setStatus("Fetching export bundles from the backend...", "neutral");

  const projectBundle = await client().getProjectExport(settings.selectedProjectId);
  const pageBundle =
    settings.importMode === "style-guide-only" || !settings.selectedPageId
      ? null
      : await client().getPageExport(settings.selectedPageId);

  postMessage({
    type: "import:run",
    payload: {
      settings,
      projectBundle,
      pageBundle
    }
  });
}

function renderResult(summary: {
  mode: string;
  pagesCreated: string[];
  nodesCreated: number;
  componentsCreated: number;
  paintStylesCreated: number;
  textStylesCreated: number;
  variablesCreated: number;
  warnings: string[];
}) {
  const summaryElement = assertDom(elements.resultSummary, "Missing result summary.");
  summaryElement.innerHTML = `
    <div class="summary-grid">
      <div class="summary-card"><strong>${summary.mode}</strong><span>mode</span></div>
      <div class="summary-card"><strong>${summary.nodesCreated}</strong><span>nodes</span></div>
      <div class="summary-card"><strong>${summary.componentsCreated}</strong><span>components</span></div>
      <div class="summary-card"><strong>${summary.paintStylesCreated + summary.textStylesCreated}</strong><span>styles</span></div>
      <div class="summary-card"><strong>${summary.variablesCreated}</strong><span>variables</span></div>
      <div class="summary-card"><strong>${summary.pagesCreated.length}</strong><span>figma pages</span></div>
    </div>
  `;

  const warningsList = assertDom(elements.warningsList, "Missing warnings list.");
  warningsList.innerHTML =
    summary.warnings.length === 0
      ? `<li class="empty">No warnings reported.</li>`
      : summary.warnings.map((warning) => `<li>${warning}</li>`).join("");
}

window.onmessage = async (event: MessageEvent<{ pluginMessage?: PluginToUiMessage }>) => {
  const pluginMessage = event.data.pluginMessage;
  if (!pluginMessage) {
    return;
  }

  switch (pluginMessage.type) {
    case "plugin:hydrate": {
      await hydrateSettings(pluginMessage.payload.settings);
      if (state.settings.selectedProjectId) {
        await loadPagesAndPreview(state.settings.selectedProjectId);
      }
      switchScreen("settings");
      setStatus("Plugin connected. Choose a project and import mode.", "success");
      break;
    }
    case "plugin:progress": {
      switchScreen("progress");
      updateProgress(pluginMessage.payload.progress, pluginMessage.payload.stage, pluginMessage.payload.message);
      break;
    }
    case "plugin:result": {
      switchScreen("result");
      renderResult(pluginMessage.payload);
      setStatus("Import finished. Review the summary and warnings.", "success");
      break;
    }
    case "plugin:error": {
      switchScreen("settings");
      setStatus(pluginMessage.payload.message, "error");
      break;
    }
    default:
      break;
  }
};

assertDom(elements.loadProjectsButton, "Missing load projects button.").addEventListener("click", async () => {
  try {
    await loadProjects();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not load projects.", "error");
  }
});

assertDom(elements.projectSelect, "Missing project select.").addEventListener("change", async () => {
  try {
    const settings = readSettingsFromForm();
    await loadPagesAndPreview(settings.selectedProjectId ?? "");
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not load project details.", "error");
  }
});

assertDom(elements.importButton, "Missing import button.").addEventListener("click", async () => {
  try {
    await handleImport();
  } catch (error) {
    switchScreen("settings");
    setStatus(error instanceof Error ? error.message : "Import could not be started.", "error");
  }
});

assertDom(elements.importAgainButton, "Missing import again button.").addEventListener("click", () => {
  switchScreen("settings");
  setStatus("Adjust the settings and import another page.", "neutral");
});

assertDom(elements.closeButton, "Missing close button.").addEventListener("click", () => {
  postMessage({ type: "ui:close" });
});

postMessage({ type: "ui:ready" });
