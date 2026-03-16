import { pageExportBundleSchema, pluginSavedSettingsSchema, projectExportBundleSchema } from "@pagecraft/shared-types";

import type { PluginToUiMessage, UiToPluginMessage } from "./messages";
import { PageCraftImportOrchestrator } from "./orchestrator";

declare const __UI_HTML__: string;

const STORAGE_KEY = "pagecraft.plugin.settings";

function postMessage(message: PluginToUiMessage) {
  figma.ui.postMessage(message);
}

async function loadSavedSettings() {
  const stored = await figma.clientStorage.getAsync(STORAGE_KEY);
  return pluginSavedSettingsSchema.parse(stored ?? {});
}

async function saveSettings(settings: unknown) {
  const parsed = pluginSavedSettingsSchema.parse(settings);
  await figma.clientStorage.setAsync(STORAGE_KEY, parsed);
  return parsed;
}

figma.showUI(__UI_HTML__, {
  width: 420,
  height: 760,
  themeColors: true
});

figma.ui.onmessage = async (message: UiToPluginMessage) => {
  try {
    switch (message.type) {
      case "ui:ready": {
        const settings = await loadSavedSettings();
        postMessage({
          type: "plugin:hydrate",
          payload: { settings }
        });
        break;
      }
      case "ui:close": {
        figma.closePlugin();
        break;
      }
      case "preferences:save": {
        const settings = await saveSettings(message.payload);
        postMessage({
          type: "plugin:hydrate",
          payload: { settings }
        });
        break;
      }
      case "import:run": {
        const settings = await saveSettings(message.payload.settings);
        const projectBundle = projectExportBundleSchema.parse(message.payload.projectBundle);
        const pageBundle = message.payload.pageBundle ? pageExportBundleSchema.parse(message.payload.pageBundle) : null;

        const orchestrator = new PageCraftImportOrchestrator({
          settings,
          onProgress(payload) {
            postMessage({
              type: "plugin:progress",
              payload
            });
          }
        });

        const summary = await orchestrator.run(projectBundle, pageBundle);
        figma.notify("PageCraft import completed.");
        postMessage({
          type: "plugin:result",
          payload: summary
        });
        break;
      }
      default:
        break;
    }
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unexpected plugin error.";
    figma.notify(messageText, { error: true });
    postMessage({
      type: "plugin:error",
      payload: {
        message: messageText
      }
    });
  }
};
