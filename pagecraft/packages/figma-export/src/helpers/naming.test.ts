import { describe, expect, it } from "vitest";

import { componentNameFromPattern, stableFallbackName, tokenStyleName } from "./naming";

describe("naming helpers", () => {
  it("creates deterministic fallback names", () => {
    expect(stableFallbackName("color", "Hero Accent", 0)).toBe("color/hero-accent");
    expect(stableFallbackName("component", "", 2)).toBe("component/component-3");
  });

  it("normalizes token names into figma style names", () => {
    expect(
      tokenStyleName({
        id: "token-1",
        name: "colors.primary.500",
        kind: "color",
        collection: "core",
        value: "#3366FF",
        description: null,
        fingerprint: "token-1"
      })
    ).toBe("colors/primary/500");
  });

  it("creates human-readable component names", () => {
    expect(
      componentNameFromPattern({
        id: "pattern-1",
        name: "nav/footer",
        kind: "footer",
        status: "validated",
        fingerprint: "pattern-1",
        confidence: 0.82,
        description: null,
        sampleNodeIds: [],
        sampleNodes: []
      })
    ).toBe("Nav Footer");
  });
});
