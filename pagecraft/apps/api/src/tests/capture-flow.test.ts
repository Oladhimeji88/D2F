import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createApp } from "../app";

describe("capture and crawl flow", () => {
  let stateDir = "";

  beforeEach(async () => {
    stateDir = await mkdtemp(join(tmpdir(), "pagecraft-capture-"));
    process.env.PAGECRAFT_STATE_FILE = join(stateDir, "state.json");
    process.env.PAGECRAFT_INLINE_JOBS = "true";
  });

  afterEach(async () => {
    await rm(stateDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("processes an extension capture inline and exposes the normalized page", async () => {
    const app = await createApp();
    const projectResponse = await app.inject({
      method: "POST",
      url: "/projects",
      payload: {
        name: "Capture Target"
      }
    });
    const project = projectResponse.json().data;

    const captureResponse = await app.inject({
      method: "POST",
      url: "/plugin/captures/current-tab",
      payload: {
        projectId: project.id,
        mode: "page",
        tabUrl: "https://example.com",
        page: {
          url: "https://example.com",
          origin: "https://example.com",
          title: "Example",
          viewport: { width: 1280, height: 720 },
          meta: { description: "Example site", canonicalUrl: "https://example.com", lang: "en" },
          links: [],
          nodes: [
            {
              id: "root",
              type: "element",
              tagName: "main",
              role: null,
              text: "Hello PageCraft",
              rect: { x: 0, y: 0, width: 800, height: 600 },
              styles: {
                color: "rgb(0,0,0)",
                backgroundColor: "#ffffff",
                fontFamily: "Inter",
                fontSize: "16px",
                fontWeight: "400",
                lineHeight: "24px",
                letterSpacing: "0px",
                display: "block",
                position: "static",
                borderRadius: null,
                boxShadow: null,
                gap: null,
                padding: null,
                margin: null,
                textTransform: null,
                textDecoration: null,
                opacity: "1"
              },
              imageUrl: null,
              svgMarkup: null,
              linkUrl: null,
              idAttr: null,
              classList: [],
              selector: "main",
              warnings: [],
              children: []
            }
          ],
          images: [],
          warnings: [],
          truncated: false,
          estimatedBytes: 1200
        }
      }
    });

    expect(captureResponse.statusCode).toBe(200);
    expect(captureResponse.json().data.status).toBe("completed");

    const projectsResponse = await app.inject({
      method: "GET",
      url: `/projects/${project.id}`
    });
    expect(projectsResponse.json().data.pagesCaptured).toBe(1);

    const pageId = projectsResponse.json().data.pages[0].id as string;
    const normalizedResponse = await app.inject({
      method: "GET",
      url: `/pages/${pageId}/normalized`
    });
    expect(normalizedResponse.statusCode).toBe(200);
    expect(normalizedResponse.json().data.nodes.length).toBeGreaterThan(0);
  });

  it("orchestrates a crawl job and records visited routes", async () => {
    const app = await createApp();
    const projectResponse = await app.inject({
      method: "POST",
      url: "/projects",
      payload: {
        name: "Crawl Target",
        rootUrl: "https://example.com"
      }
    });
    const project = projectResponse.json().data;

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string | URL) => {
        const url = String(input);
        const html =
          url === "https://example.com"
            ? `<html><head><title>Home</title></head><body><a href="/pricing">Pricing</a><a href="/docs">Docs</a></body></html>`
            : `<html><head><title>${url}</title></head><body><p>Sub page</p></body></html>`;

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html"
          }
        });
      })
    );

    const crawlResponse = await app.inject({
      method: "POST",
      url: "/plugin/crawls",
      payload: {
        projectId: project.id,
        siteOrigin: "https://example.com",
        tabUrl: "https://example.com",
        routes: [
          {
            url: "https://example.com",
            pathname: "/",
            depth: 0,
            source: "manual",
            skippedReason: null
          }
        ],
        settings: {
          maxDepth: 1,
          maxPages: 4,
          filters: {
            include: [],
            exclude: []
          }
        }
      }
    });

    expect(crawlResponse.statusCode).toBe(200);
    expect(crawlResponse.json().data.status).toBe("completed");

    const projectDetail = await app.inject({
      method: "GET",
      url: `/projects/${project.id}`
    });

    expect(projectDetail.json().data.crawlRuns[0].visitedCount).toBeGreaterThan(0);
    expect(projectDetail.json().data.patterns).toBeDefined();
  });
});
