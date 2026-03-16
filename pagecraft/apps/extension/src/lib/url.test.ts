import { describe, expect, it } from "vitest";

import { canonicalizeUrl, isProbablyDestructiveRoute, shouldIncludeRoute } from "./url";

describe("canonicalizeUrl", () => {
  it("removes fragments and trailing slashes while preserving origin", () => {
    expect(canonicalizeUrl("https://example.com/docs/#intro")).toBe("https://example.com/docs");
    expect(canonicalizeUrl("https://example.com:443/docs/")).toBe("https://example.com/docs");
  });

  it("rejects non-http protocols", () => {
    expect(canonicalizeUrl("javascript:alert(1)")).toBeNull();
    expect(canonicalizeUrl("mailto:test@example.com")).toBeNull();
  });
});

describe("route filters", () => {
  const settings = {
    maxDepth: 2,
    maxPages: 20,
    filters: {
      include: ["/docs/*"],
      exclude: ["/docs/private/*"]
    }
  } as const;

  it("skips destructive paths", () => {
    expect(isProbablyDestructiveRoute("https://example.com/logout")).toBe(true);
    expect(shouldIncludeRoute("https://example.com/logout", "https://example.com", settings)).toBe(false);
  });

  it("enforces include and exclude patterns", () => {
    expect(shouldIncludeRoute("https://example.com/docs/getting-started", "https://example.com", settings)).toBe(true);
    expect(shouldIncludeRoute("https://example.com/docs/private/roadmap", "https://example.com", settings)).toBe(false);
    expect(shouldIncludeRoute("https://example.com/blog/post", "https://example.com", settings)).toBe(false);
  });
});
