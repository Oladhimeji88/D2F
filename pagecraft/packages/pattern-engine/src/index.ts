import type { NormalizedCapture, NormalizedNode, Pattern } from "@pagecraft/shared-types";

function bucket(value: number): string {
  if (value <= 80) {
    return "sm";
  }
  if (value <= 240) {
    return "md";
  }
  if (value <= 560) {
    return "lg";
  }
  return "xl";
}

function compactText(text: string | null): string {
  if (!text) {
    return "";
  }

  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  return trimmed.length > 32 ? `${trimmed.slice(0, 32)}...` : trimmed;
}

export function fingerprintNode(node: NormalizedNode): string {
  const childFingerprints = node.children.map(fingerprintNode).join("|");
  const fillKey = node.fills.length > 0 ? "filled" : "plain";
  const layoutKey = node.layout?.mode ?? "NONE";
  const textKey = node.role === "button" || node.htmlTag === "button" ? "button" : compactText(node.textContent);
  return [
    node.htmlTag ?? node.type,
    node.role ?? "none",
    layoutKey,
    fillKey,
    bucket(node.width),
    bucket(node.height),
    textKey,
    childFingerprints
  ].join("::");
}

function inferPatternKind(node: NormalizedNode): Pattern["kind"] {
  const tag = node.htmlTag?.toLowerCase() ?? "";
  const role = node.role?.toLowerCase() ?? "";

  if (role === "button" || tag === "button") {
    return "button";
  }

  if (tag === "nav" || role === "navigation") {
    return "navigation";
  }

  if (tag === "footer") {
    return "footer";
  }

  if (tag === "input" || role === "textbox" || role === "combobox") {
    return "input";
  }

  const hasImage = node.children.some((child) => child.type === "image" || child.imageRef);
  const hasText = node.children.some((child) => child.type === "text");
  if (hasImage && hasText) {
    return "card";
  }

  return "generic";
}

function inferPatternName(kind: Pattern["kind"], node: NormalizedNode): string {
  switch (kind) {
    case "button":
      return node.textContent ? `${compactText(node.textContent)} Button` : "Primary Button";
    case "card":
      return "Feature Card";
    case "navigation":
      return "Top Navigation";
    case "footer":
      return "Footer Group";
    case "input":
      return "Form Input";
    default:
      return node.name ?? node.htmlTag ?? "Reusable Block";
  }
}

interface SubtreeEntry {
  pageId: string;
  node: NormalizedNode;
  fingerprint: string;
}

function collectSubtrees(pageId: string, nodes: NormalizedNode[]): SubtreeEntry[] {
  const entries: SubtreeEntry[] = [];
  const visit = (node: NormalizedNode) => {
    entries.push({
      pageId,
      node,
      fingerprint: fingerprintNode(node)
    });
    node.children.forEach(visit);
  };

  nodes.forEach(visit);
  return entries;
}

export interface DetectedPattern extends Pattern {
  pageIds: string[];
}

export function detectPatternsAcrossCaptures(projectId: string, captures: NormalizedCapture[]): DetectedPattern[] {
  const groups = new Map<string, SubtreeEntry[]>();

  for (const capture of captures) {
    for (const entry of collectSubtrees(capture.pageId, capture.nodes)) {
      if (entry.node.children.length === 0 && !entry.node.textContent) {
        continue;
      }

      const current = groups.get(entry.fingerprint) ?? [];
      current.push(entry);
      groups.set(entry.fingerprint, current);
    }
  }

  const patterns: DetectedPattern[] = [];
  let index = 0;

  for (const [fingerprint, entries] of groups) {
    const pageIds = [...new Set(entries.map((entry) => entry.pageId))];
    if (pageIds.length < 2 && entries.length < 3) {
      continue;
    }

    const representative = entries[0]?.node;
    if (!representative) {
      continue;
    }

    const kind = inferPatternKind(representative);
    const densityScore = Math.min(1, entries.length / 4);
    const spreadScore = Math.min(1, pageIds.length / Math.max(1, captures.length));
    const confidence = Number((densityScore * 0.55 + spreadScore * 0.45).toFixed(2));

    patterns.push({
      id: `${projectId}_pattern_${index + 1}`,
      name: inferPatternName(kind, representative),
      kind,
      status: confidence >= 0.6 ? "validated" : "draft",
      fingerprint,
      confidence,
      description: `Detected across ${pageIds.length} page(s) with ${entries.length} matching subtree(s).`,
      sampleNodeIds: entries.slice(0, 5).map((entry) => entry.node.id),
      sampleNodes: entries.slice(0, 3).map((entry) => entry.node),
      pageIds
    });
    index += 1;
  }

  return patterns.sort((left, right) => right.confidence - left.confidence);
}

export interface TemplateCluster {
  templateId: string;
  pageIds: string[];
  similarity: number;
  sharedFingerprints: string[];
}

export function clusterPagesByTemplate(captures: NormalizedCapture[]): TemplateCluster[] {
  const fingerprintSets = captures.map((capture) => ({
    pageId: capture.pageId,
    fingerprints: new Set(collectSubtrees(capture.pageId, capture.nodes).map((entry) => entry.fingerprint))
  }));

  const clusters: TemplateCluster[] = [];
  const visited = new Set<string>();

  for (const current of fingerprintSets) {
    if (visited.has(current.pageId)) {
      continue;
    }

    const clusterPageIds = [current.pageId];
    const shared = new Set(current.fingerprints);

    for (const candidate of fingerprintSets) {
      if (candidate.pageId === current.pageId || visited.has(candidate.pageId)) {
        continue;
      }

      const intersection = [...current.fingerprints].filter((fingerprint) => candidate.fingerprints.has(fingerprint));
      const union = new Set([...current.fingerprints, ...candidate.fingerprints]);
      const similarity = union.size === 0 ? 0 : intersection.length / union.size;

      if (similarity >= 0.35) {
        clusterPageIds.push(candidate.pageId);
        intersection.forEach((fingerprint) => shared.add(fingerprint));
        visited.add(candidate.pageId);
      }
    }

    visited.add(current.pageId);
    clusters.push({
      templateId: `template_${clusters.length + 1}`,
      pageIds: clusterPageIds,
      similarity: Number((shared.size / Math.max(1, current.fingerprints.size)).toFixed(2)),
      sharedFingerprints: [...shared].slice(0, 10)
    });
  }

  return clusters;
}
