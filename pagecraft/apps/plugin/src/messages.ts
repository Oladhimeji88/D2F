import type { PageExportBundle, PluginSavedSettings, ProjectExportBundle } from "@pagecraft/shared-types";
import type { ImportProgress, ImportSummary } from "@pagecraft/figma-export";

export interface ImportRunPayload {
  settings: PluginSavedSettings;
  projectBundle: ProjectExportBundle;
  pageBundle: PageExportBundle | null;
}

export type UiToPluginMessage =
  | { type: "ui:ready" }
  | { type: "ui:close" }
  | { type: "preferences:save"; payload: PluginSavedSettings }
  | { type: "import:run"; payload: ImportRunPayload };

export type PluginToUiMessage =
  | { type: "plugin:hydrate"; payload: { settings: PluginSavedSettings } }
  | { type: "plugin:progress"; payload: ImportProgress }
  | { type: "plugin:result"; payload: ImportSummary }
  | { type: "plugin:error"; payload: { message: string } };
