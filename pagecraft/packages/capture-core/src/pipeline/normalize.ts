import type {
  NormalizedCapture,
  NormalizedNode,
  SerializedNode,
  SerializedPage,
  WarningLog
} from "@pagecraft/shared-types";

import { createId } from "../utils/id";

function parseNumericValue(input: string | null | undefined): number | null {
  if (!input) {
    return null;
  }

  const match = input.match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : null;
}

function fontWeight(input: string | null | undefined): number | null {
  const value = parseNumericValue(input);
  return value && value > 0 ? value : null;
}

function textNodeType(node: SerializedNode): string {
  if (node.tagName === "#text") {
    return "text";
  }

  if (node.svgMarkup) {
    return "vector";
  }

  if (node.imageUrl) {
    return "image";
  }

  return "frame";
}

function inferLayout(node: SerializedNode) {
  if (node.children.length < 2) {
    return null;
  }

  const xSpread = Math.max(...node.children.map((child) => child.rect.x)) - Math.min(...node.children.map((child) => child.rect.x));
  const ySpread = Math.max(...node.children.map((child) => child.rect.y)) - Math.min(...node.children.map((child) => child.rect.y));

  return {
    mode: ySpread > xSpread ? ("VERTICAL" as const) : ("HORIZONTAL" as const),
    wrap: "NO_WRAP" as const,
    justifyContent: null,
    alignItems: null,
    alignSelf: null,
    positionType: "AUTO" as const,
    sizingHorizontal: null,
    sizingVertical: null
  };
}

function normalizeNode(node: SerializedNode, path: string, warnings: WarningLog[]): NormalizedNode | null {
  if (node.rect.width === 0 && node.rect.height === 0 && !node.text) {
    warnings.push({
      id: createId("warning"),
      severity: "info",
      code: "NODE_SKIPPED_ZERO_SIZE",
      message: `Skipped zero-size node at ${path}.`,
      context: null
    });
    return null;
  }

  const normalized: NormalizedNode = {
    id: node.id,
    type: textNodeType(node),
    htmlTag: node.tagName,
    name: node.selector ?? node.tagName,
    role: node.role,
    textContent: node.text,
    x: node.rect.x,
    y: node.rect.y,
    width: node.rect.width,
    height: node.rect.height,
    visible: true,
    opacity: parseNumericValue(node.styles.opacity) ?? 1,
    zIndex: null,
    fills: node.styles.backgroundColor
      ? [
          {
            type: "SOLID",
            color: null,
            opacity: 1,
            imageUrl: null,
            blendMode: null
          }
        ]
      : [],
    strokes: [],
    cornerRadius: parseNumericValue(node.styles.borderRadius),
    shadows: node.styles.boxShadow
      ? [
          {
            x: 0,
            y: 8,
            blur: 24,
            spread: 0,
            color: { r: 0, g: 0, b: 0, a: 0.12 },
            inset: false
          }
        ]
      : [],
    typography: node.text
      ? {
          fontFamily: node.styles.fontFamily,
          fontStyle: null,
          fontWeight: fontWeight(node.styles.fontWeight),
          fontSize: parseNumericValue(node.styles.fontSize),
          lineHeight: parseNumericValue(node.styles.lineHeight),
          letterSpacing: parseNumericValue(node.styles.letterSpacing),
          textAlignHorizontal: null,
          textAlignVertical: null,
          textTransform: node.styles.textTransform,
          textDecoration: node.styles.textDecoration
        }
      : null,
    layout: inferLayout(node),
    padding: null,
    gap: parseNumericValue(node.styles.gap),
    alignment: null,
    constraints: null,
    imageRef: node.imageUrl,
    svgRef: node.svgMarkup,
    selector: node.selector,
    sourcePath: path,
    children: [],
    inferredFingerprint: `${node.tagName}:${node.children.length}:${node.role ?? "none"}`
  };

  normalized.children = node.children
    .map((child, index) => normalizeNode(child, `${path}/${index}`, warnings))
    .filter((child): child is NormalizedNode => child !== null);

  return normalized;
}

export function normalizeSerializedPage(
  pageId: string,
  page: SerializedPage,
  captureId = createId("capture")
): NormalizedCapture {
  const warnings: WarningLog[] = [...page.warnings].map((message) => ({
    id: createId("warning"),
    severity: "warning",
    code: "SERIALIZER_WARNING",
    message,
    context: null
  }));

  const nodes = page.nodes
    .map((node, index) => normalizeNode(node, `root/${index}`, warnings))
    .filter((node): node is NormalizedNode => node !== null);

  return {
    id: captureId,
    pageId,
    url: page.url,
    title: page.title || null,
    viewport: page.viewport,
    nodes,
    warnings,
    capturedAt: new Date().toISOString()
  };
}
