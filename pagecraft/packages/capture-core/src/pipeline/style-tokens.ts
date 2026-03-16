import type { NormalizedCapture, NormalizedNode, StyleToken } from "@pagecraft/shared-types";

import { createId } from "../utils/id";

function walk(nodes: NormalizedNode[], visitor: (node: NormalizedNode) => void) {
  for (const node of nodes) {
    visitor(node);
    walk(node.children, visitor);
  }
}

function numericBucket(value: number): string {
  if (value <= 4) {
    return "xs";
  }

  if (value <= 8) {
    return "sm";
  }

  if (value <= 16) {
    return "md";
  }

  if (value <= 24) {
    return "lg";
  }

  return "xl";
}

export function extractStyleTokens(projectId: string, capture: NormalizedCapture): StyleToken[] {
  const fontFamilies = new Set<string>();
  const fontSizes = new Set<number>();
  const radiusValues = new Set<number>();
  const shadowFingerprints = new Set<string>();

  walk(capture.nodes, (node) => {
    if (node.typography?.fontFamily) {
      fontFamilies.add(node.typography.fontFamily);
    }

    if (node.typography?.fontSize) {
      fontSizes.add(node.typography.fontSize);
    }

    if (typeof node.cornerRadius === "number") {
      radiusValues.add(node.cornerRadius);
    }

    if (node.shadows.length > 0) {
      shadowFingerprints.add(JSON.stringify(node.shadows[0]));
    }
  });

  const tokens: StyleToken[] = [];

  for (const family of fontFamilies) {
    tokens.push({
      id: createId("token"),
      name: `typography.body.${family.toLowerCase().replace(/\s+/g, "-")}`,
      kind: "typography",
      collection: "core",
      value: {
        fontFamily: family,
        fontSize: 16,
        lineHeight: 24
      },
      description: null,
      fingerprint: family
    });
  }

  for (const size of fontSizes) {
    tokens.push({
      id: createId("token"),
      name: `spacing.${Math.round(size / 4)}`,
      kind: "spacing",
      collection: "core",
      value: size,
      description: null,
      fingerprint: `spacing:${size}`
    });
  }

  for (const radius of radiusValues) {
    tokens.push({
      id: createId("token"),
      name: `radius.${numericBucket(radius)}`,
      kind: "radius",
      collection: "core",
      value: radius,
      description: null,
      fingerprint: `radius:${radius}`
    });
  }

  for (const shadow of shadowFingerprints) {
    tokens.push({
      id: createId("token"),
      name: `shadow.${numericBucket(shadow.length / 10)}`,
      kind: "shadow",
      collection: "core",
      value: JSON.parse(shadow) as unknown,
      description: null,
      fingerprint: shadow
    });
  }

  return tokens.map((token) => ({
    ...token,
    id: `${projectId}_${token.id}`
  }));
}
