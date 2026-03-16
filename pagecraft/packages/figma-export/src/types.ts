import type {
  NormalizedNode,
  PageExportBundle,
  Pattern,
  PluginImportMode,
  PluginImportOptions,
  ProjectExportBundle,
  StyleToken,
  WarningLog
} from "@pagecraft/shared-types";

export interface ImportSettings {
  mode: PluginImportMode;
  options: PluginImportOptions;
}

export interface TokenCollections {
  colors: StyleToken[];
  typography: StyleToken[];
  spacing: StyleToken[];
  radius: StyleToken[];
  shadow: StyleToken[];
  effects: StyleToken[];
}

export interface ComponentCandidate {
  id: string;
  name: string;
  kind: Pattern["kind"];
  confidence: number;
  sampleNodes: NormalizedNode[];
  warning?: string;
}

export interface ImportPlan {
  projectBundle: ProjectExportBundle;
  pageBundle: PageExportBundle | null;
  tokens: TokenCollections;
  componentCandidates: ComponentCandidate[];
  pageNodes: NormalizedNode[];
  warnings: WarningLog[];
  coverNotes: string[];
  importTitle: string;
}

export interface ImportSummary {
  mode: PluginImportMode;
  pagesCreated: string[];
  nodesCreated: number;
  componentsCreated: number;
  paintStylesCreated: number;
  textStylesCreated: number;
  variablesCreated: number;
  warnings: string[];
}

export interface ImportProgress {
  stage: "prepare" | "cover" | "styles" | "components" | "pages" | "complete";
  message: string;
  progress: number;
}
