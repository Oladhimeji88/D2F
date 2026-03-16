import { describe, expect, it } from "vitest";

import { discoverRoutesFromDocument } from "./route-discovery";

describe("discoverRoutesFromDocument", () => {
  it("keeps same-origin routes, removes duplicates, and skips risky paths", () => {
    document.body.innerHTML = `
      <a href="/docs">Docs</a>
      <a href="/docs/">Docs duplicate</a>
      <a href="/logout">Logout</a>
      <a href="https://external.example.com/docs">External</a>
    `;

    const result = discoverRoutesFromDocument(document, "https://example.com/home", {
      maxDepth: 2,
      maxPages: 20,
      filters: {
        include: [],
        exclude: []
      }
    });

    expect(result.siteOrigin).toBe("https://example.com");
    expect(result.routes.map((route) => route.url)).toEqual(["https://example.com/home", "https://example.com/docs"]);
  });

  it("applies include and exclude filters before returning crawl candidates", () => {
    document.body.innerHTML = `
      <a href="/docs/getting-started">Getting started</a>
      <a href="/docs/private">Private docs</a>
    `;

    const result = discoverRoutesFromDocument(document, "https://example.com/docs", {
      maxDepth: 2,
      maxPages: 20,
      filters: {
        include: ["/docs*"],
        exclude: ["/docs/private*"]
      }
    });

    expect(result.routes.map((route) => route.pathname)).toEqual(["/docs", "/docs/getting-started"]);
  });
});
