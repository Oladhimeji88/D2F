import type { Pattern, ProjectExportBundle, PageExportBundle, StyleToken, WarningLog } from "@pagecraft/shared-types";

import { componentNameFromPattern, tokenStyleName } from "./naming";
import type { ComponentCandidate, ImportPlan, ImportSettings, TokenCollections } from "../types";

function groupTokens(tokens: StyleToken[]): TokenCollections {
  return {
    colors: tokens.filter((token) => token.kind === "color"),
    typography: tokens.filter((token) => token.kind === "typography"),
    spacing: tokens.filter((token) => token.kind === "spacing"),
    radius: tokens.filter((token) => token.kind === "radius"),
    shadow: tokens.filter((token) => token.kind === "shadow"),
    effects: tokens.filter((token) => token.kind === "effect" || token.kind === "border")
  };
}

function patternCandidates(patterns: Pattern[]): ComponentCandidate[] {
  return patterns.map((pattern, index) => ({
    id: pattern.id,
    name: componentNameFromPattern(pattern, index),
    kind: pattern.kind,
    confidence: pattern.confidence,
    sampleNodes: pattern.sampleNodes,
    warning: pattern.sampleNodes.length === 0 ? "Pattern did not include sample nodes. Using a semantic fallback." : undefined
  }));
}

function mergeWarnings(projectWarnings: WarningLog[], pageWarnings: WarningLog[]): WarningLog[] {
  const seen = new Set<string>();
  return [...projectWarnings, ...pageWarnings].filter((warning) => {
    const key = `${warning.code}:${warning.message}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function coverNotes(projectBundle: ProjectExportBundle, pageBundle: PageExportBundle | null, settings: ImportSettings): string[] {
  const notes = [
    `Mode: ${settings.mode}`,
    `Pages available in backend export: ${projectBundle.pages.length}`,
    `Styles available: ${projectBundle.styles.length}`,
    `Patterns available: ${projectBundle.patterns.length}`
  ];

  if (pageBundle) {
    notes.push(`Imported page: ${pageBundle.page.title ?? pageBundle.page.path}`);
    notes.push(`Normalized nodes: ${pageBundle.capture.nodes.length}`);
  }

  return notes;
}

export function mapExportBundleToPlan(
  projectBundle: ProjectExportBundle,
  pageBundle: PageExportBundle | null,
  settings: ImportSettings
): ImportPlan {
  const combinedTokens = projectBundle.styles.length > 0 ? projectBundle.styles : pageBundle?.styles ?? [];
  const combinedPatterns = projectBundle.patterns.length > 0 ? projectBundle.patterns : pageBundle?.patterns ?? [];
  const pageNodes = settings.mode === "style-guide-only" ? [] : pageBundle?.capture.nodes ?? [];

  const warnings = mergeWarnings(projectBundle.warnings, pageBundle?.warnings ?? []);
  const tokens = groupTokens(combinedTokens.map((token, index) => ({ ...token, name: tokenStyleName(token, index) })));

  return {
    projectBundle,
    pageBundle,
    tokens,
    componentCandidates: patternCandidates(combinedPatterns),
    pageNodes,
    warnings,
    coverNotes: coverNotes(projectBundle, pageBundle, settings),
    importTitle: pageBundle?.page.title ?? projectBundle.project.name
  };
}
