import { describe, expect, it } from "vitest";

import { inferAutoLayout, sortChildrenForLayout } from "./layout";

const baseNode = {
  htmlTag: "div",
  name: "Container",
  role: null,
  textContent: null,
  visible: true,
  opacity: 1,
  zIndex: null,
  fills: [],
  strokes: [],
  cornerRadius: null,
  shadows: [],
  typography: null,
  padding: null,
  gap: null,
  alignment: null,
  constraints: null,
  imageRef: null,
  svgRef: null,
  selector: null,
  sourcePath: null,
  inferredFingerprint: null
} as const;

describe("layout inference", () => {
  it("prefers explicit layout metadata when available", () => {
    const result = inferAutoLayout({
      ...baseNode,
      id: "root",
      type: "frame",
      x: 0,
      y: 0,
      width: 400,
      height: 80,
      layout: {
        mode: "HORIZONTAL",
        wrap: "NO_WRAP",
        justifyContent: "CENTER",
        alignItems: "CENTER",
        alignSelf: null,
        positionType: "AUTO",
        sizingHorizontal: null,
        sizingVertical: null
      },
      children: []
    });

    expect(result.mode).toBe("HORIZONTAL");
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it("infers vertical layout from stacked children", () => {
    const node = {
      ...baseNode,
      id: "root",
      type: "frame",
      x: 0,
      y: 0,
      width: 320,
      height: 200,
      layout: null,
      children: [
        { ...baseNode, id: "a", type: "text", x: 0, y: 0, width: 240, height: 24, layout: null, children: [] },
        { ...baseNode, id: "b", type: "text", x: 0, y: 40, width: 240, height: 24, layout: null, children: [] }
      ]
    };

    const result = inferAutoLayout(node);
    expect(result.mode).toBe("VERTICAL");
    expect(sortChildrenForLayout(node, "VERTICAL").map((child) => child.id)).toEqual(["a", "b"]);
  });
});
