import { describe, expect, it } from "vitest";

import { clusterPagesByTemplate, detectPatternsAcrossCaptures, fingerprintNode } from "./index";

const buttonNode = {
  id: "button-1",
  type: "frame",
  htmlTag: "button",
  name: "Primary Button",
  role: "button",
  textContent: null,
  x: 0,
  y: 0,
  width: 180,
  height: 48,
  visible: true,
  opacity: 1,
  zIndex: null,
  fills: [{ type: "SOLID" as const, color: { r: 0.1, g: 0.2, b: 0.8, a: 1 }, opacity: 1, imageUrl: null, blendMode: null }],
  strokes: [],
  cornerRadius: 12,
  shadows: [],
  typography: null,
  layout: { mode: "HORIZONTAL" as const, wrap: "NO_WRAP" as const, justifyContent: null, alignItems: null, alignSelf: null, positionType: "AUTO" as const, sizingHorizontal: null, sizingVertical: null },
  padding: { top: 12, right: 20, bottom: 12, left: 20 },
  gap: 8,
  alignment: null,
  constraints: null,
  imageRef: null,
  svgRef: null,
  selector: "button",
  sourcePath: "root/0",
  children: [
    {
      id: "button-label-1",
      type: "text",
      htmlTag: "#text",
      name: "Button label",
      role: null,
      textContent: "Start free trial",
      x: 0,
      y: 0,
      width: 120,
      height: 24,
      visible: true,
      opacity: 1,
      zIndex: null,
      fills: [],
      strokes: [],
      cornerRadius: null,
      shadows: [],
      typography: null,
      layout: null,
      padding: null,
      gap: null,
      alignment: null,
      constraints: null,
      imageRef: null,
      svgRef: null,
      selector: null,
      sourcePath: "root/0/0",
      children: [],
      inferredFingerprint: null
    }
  ],
  inferredFingerprint: null
};

describe("pattern engine", () => {
  it("builds deterministic subtree fingerprints", () => {
    expect(fingerprintNode(buttonNode)).toEqual(fingerprintNode({ ...buttonNode }));
  });

  it("detects repeated patterns across captures", () => {
    const captures = [
      {
        id: "capture-1",
        pageId: "page-1",
        url: "https://example.com",
        title: "Home",
        viewport: { width: 1440, height: 900 },
        nodes: [buttonNode],
        warnings: [],
        capturedAt: null
      },
      {
        id: "capture-2",
        pageId: "page-2",
        url: "https://example.com/pricing",
        title: "Pricing",
        viewport: { width: 1440, height: 900 },
        nodes: [{ ...buttonNode, id: "button-2" }],
        warnings: [],
        capturedAt: null
      }
    ];

    const patterns = detectPatternsAcrossCaptures("project-1", captures);
    expect(patterns[0]?.kind).toBe("button");
    expect(patterns[0]?.pageIds).toEqual(["page-1", "page-2"]);
  });

  it("clusters pages by template similarity", () => {
    const captures = [
      {
        id: "capture-1",
        pageId: "page-1",
        url: "https://example.com",
        title: "Home",
        viewport: { width: 1440, height: 900 },
        nodes: [buttonNode],
        warnings: [],
        capturedAt: null
      },
      {
        id: "capture-2",
        pageId: "page-2",
        url: "https://example.com/pricing",
        title: "Pricing",
        viewport: { width: 1440, height: 900 },
        nodes: [{ ...buttonNode, id: "button-2" }],
        warnings: [],
        capturedAt: null
      }
    ];

    const clusters = clusterPagesByTemplate(captures);
    expect(clusters[0]?.pageIds).toContain("page-1");
    expect(clusters[0]?.pageIds).toContain("page-2");
  });
});
