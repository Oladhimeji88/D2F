import type { NormalizedNode } from "@pagecraft/shared-types";

export interface LayoutInference {
  mode: "NONE" | "HORIZONTAL" | "VERTICAL";
  confidence: number;
  gap: number;
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

function averageGap(nodes: NormalizedNode[], axis: "x" | "y"): number {
  if (nodes.length < 2) {
    return 0;
  }

  const sorted = [...nodes].sort((left, right) => left[axis] - right[axis]);
  const gaps = sorted.slice(1).map((node, index) => {
    const previous = sorted[index];
    if (!previous) {
      return 0;
    }

    return axis === "x" ? node.x - (previous.x + previous.width) : node.y - (previous.y + previous.height);
  });

  return Math.round(gaps.reduce((total, gap) => total + gap, 0) / gaps.length);
}

function spread(nodes: NormalizedNode[], axis: "x" | "y"): number {
  if (nodes.length === 0) {
    return 0;
  }

  const values = nodes.map((node) => node[axis]);
  return Math.max(...values) - Math.min(...values);
}

export function inferAutoLayout(node: NormalizedNode): LayoutInference {
  if (node.layout && node.layout.mode !== "NONE") {
    return {
      mode: node.layout.mode,
      confidence: 0.92,
      gap: node.gap ?? 0,
      padding: node.padding ?? { top: 0, right: 0, bottom: 0, left: 0 }
    };
  }

  if (node.children.length < 2) {
    return {
      mode: "NONE",
      confidence: 0.25,
      gap: 0,
      padding: node.padding ?? { top: 0, right: 0, bottom: 0, left: 0 }
    };
  }

  const horizontalSpread = spread(node.children, "y");
  const verticalSpread = spread(node.children, "x");
  const mode = horizontalSpread <= verticalSpread ? "HORIZONTAL" : "VERTICAL";

  return {
    mode,
    confidence: 0.6,
    gap: averageGap(node.children, mode === "HORIZONTAL" ? "x" : "y"),
    padding: node.padding ?? { top: 0, right: 0, bottom: 0, left: 0 }
  };
}

export function sortChildrenForLayout(node: NormalizedNode, mode: "HORIZONTAL" | "VERTICAL"): NormalizedNode[] {
  return [...node.children].sort((left, right) => (mode === "HORIZONTAL" ? left.x - right.x : left.y - right.y));
}
