import type { NormalizedCapture } from "@pagecraft/shared-types";

import { buildPlaceholderThumbnail } from "../utils/thumbnail";
import type { StoreState } from "./types";

function createDemoCapture(pageId: string, url: string, title: string): NormalizedCapture {
  return {
    id: `capture_${pageId}`,
    pageId,
    url,
    title,
    viewport: {
      width: 1440,
      height: 1024
    },
    nodes: [
      {
        id: `root_${pageId}`,
        type: "frame",
        htmlTag: "main",
        name: "Main",
        role: "main",
        textContent: null,
        x: 0,
        y: 0,
        width: 1280,
        height: 920,
        visible: true,
        opacity: 1,
        zIndex: null,
        fills: [
          {
            type: "SOLID",
            color: { r: 1, g: 1, b: 1, a: 1 },
            opacity: 1,
            imageUrl: null,
            blendMode: null
          }
        ],
        strokes: [],
        cornerRadius: 0,
        shadows: [],
        typography: null,
        layout: {
          mode: "VERTICAL",
          wrap: "NO_WRAP",
          justifyContent: null,
          alignItems: null,
          alignSelf: null,
          positionType: "AUTO",
          sizingHorizontal: null,
          sizingVertical: null
        },
        padding: { top: 40, right: 40, bottom: 40, left: 40 },
        gap: 24,
        alignment: null,
        constraints: null,
        imageRef: null,
        svgRef: null,
        selector: "main",
        sourcePath: "root/0",
        inferredFingerprint: "frame:main:3",
        children: [
          {
            id: `hero_${pageId}`,
            type: "frame",
            htmlTag: "section",
            name: "Hero",
            role: null,
            textContent: null,
            x: 0,
            y: 0,
            width: 1120,
            height: 260,
            visible: true,
            opacity: 1,
            zIndex: null,
            fills: [
              {
                type: "SOLID",
                color: { r: 0.961, g: 0.972, b: 0.996, a: 1 },
                opacity: 1,
                imageUrl: null,
                blendMode: null
              }
            ],
            strokes: [],
            cornerRadius: 24,
            shadows: [
              {
                x: 0,
                y: 12,
                blur: 36,
                spread: 0,
                color: { r: 0, g: 0, b: 0, a: 0.08 },
                inset: false
              }
            ],
            typography: null,
            layout: {
              mode: "VERTICAL",
              wrap: "NO_WRAP",
              justifyContent: null,
              alignItems: null,
              alignSelf: null,
              positionType: "AUTO",
              sizingHorizontal: null,
              sizingVertical: null
            },
            padding: { top: 32, right: 32, bottom: 32, left: 32 },
            gap: 16,
            alignment: null,
            constraints: null,
            imageRef: null,
            svgRef: null,
            selector: ".hero",
            sourcePath: "root/0/0",
            inferredFingerprint: "hero:block",
            children: [
              {
                id: `heading_${pageId}`,
                type: "text",
                htmlTag: "h1",
                name: "Heading",
                role: "heading",
                textContent: title,
                x: 32,
                y: 32,
                width: 720,
                height: 64,
                visible: true,
                opacity: 1,
                zIndex: null,
                fills: [],
                strokes: [],
                cornerRadius: null,
                shadows: [],
                typography: {
                  fontFamily: "Inter",
                  fontStyle: "Bold",
                  fontWeight: 700,
                  fontSize: 42,
                  lineHeight: 52,
                  letterSpacing: 0,
                  textAlignHorizontal: null,
                  textAlignVertical: null,
                  textTransform: null,
                  textDecoration: null
                },
                layout: null,
                padding: null,
                gap: null,
                alignment: null,
                constraints: null,
                imageRef: null,
                svgRef: null,
                selector: "h1",
                sourcePath: "root/0/0/0",
                children: [],
                inferredFingerprint: "heading:h1"
              },
              {
                id: `button_${pageId}`,
                type: "frame",
                htmlTag: "button",
                name: "Primary Button",
                role: "button",
                textContent: null,
                x: 32,
                y: 128,
                width: 200,
                height: 52,
                visible: true,
                opacity: 1,
                zIndex: null,
                fills: [
                  {
                    type: "SOLID",
                    color: { r: 0.082, g: 0.369, b: 0.937, a: 1 },
                    opacity: 1,
                    imageUrl: null,
                    blendMode: null
                  }
                ],
                strokes: [],
                cornerRadius: 16,
                shadows: [],
                typography: null,
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
                padding: { top: 14, right: 20, bottom: 14, left: 20 },
                gap: 8,
                alignment: null,
                constraints: null,
                imageRef: null,
                svgRef: null,
                selector: "button",
                sourcePath: "root/0/0/1",
                children: [
                  {
                    id: `button_text_${pageId}`,
                    type: "text",
                    htmlTag: "#text",
                    name: "Button label",
                    role: null,
                    textContent: "Start free trial",
                    x: 0,
                    y: 0,
                    width: 132,
                    height: 24,
                    visible: true,
                    opacity: 1,
                    zIndex: null,
                    fills: [],
                    strokes: [],
                    cornerRadius: null,
                    shadows: [],
                    typography: {
                      fontFamily: "Inter",
                      fontStyle: "Semi Bold",
                      fontWeight: 600,
                      fontSize: 16,
                      lineHeight: 24,
                      letterSpacing: 0,
                      textAlignHorizontal: null,
                      textAlignVertical: null,
                      textTransform: null,
                      textDecoration: null
                    },
                    layout: null,
                    padding: null,
                    gap: null,
                    alignment: null,
                    constraints: null,
                    imageRef: null,
                    svgRef: null,
                    selector: null,
                    sourcePath: "root/0/0/1/0",
                    children: [],
                    inferredFingerprint: "button:text"
                  }
                ],
                inferredFingerprint: "button:primary"
              }
            ]
          },
          {
            id: `cards_${pageId}`,
            type: "frame",
            htmlTag: "section",
            name: "Feature Cards",
            role: null,
            textContent: null,
            x: 0,
            y: 300,
            width: 1120,
            height: 280,
            visible: true,
            opacity: 1,
            zIndex: null,
            fills: [],
            strokes: [],
            cornerRadius: null,
            shadows: [],
            typography: null,
            layout: {
              mode: "HORIZONTAL",
              wrap: "NO_WRAP",
              justifyContent: null,
              alignItems: null,
              alignSelf: null,
              positionType: "AUTO",
              sizingHorizontal: null,
              sizingVertical: null
            },
            padding: { top: 0, right: 0, bottom: 0, left: 0 },
            gap: 24,
            alignment: null,
            constraints: null,
            imageRef: null,
            svgRef: null,
            selector: ".cards",
            sourcePath: "root/0/1",
            children: [],
            inferredFingerprint: "cards:grid"
          }
        ]
      }
    ],
    warnings: [],
    capturedAt: new Date().toISOString()
  };
}

export function createDemoState(): StoreState {
  const createdAt = new Date("2026-03-15T12:00:00.000Z").toISOString();
  const projectId = "project_demo_marketing";

  return {
    users: [
      {
        id: "user_demo",
        email: "demo@pagecraft.dev",
        name: "PageCraft Demo"
      }
    ],
    projects: [
      {
        id: projectId,
        name: "Demo Marketing Site",
        slug: "demo-marketing-site",
        status: "active",
        description: "Seeded project for local development and UI validation.",
        rootUrl: "https://demo.pagecraft.dev",
        createdAt,
        updatedAt: createdAt
      }
    ],
    pages: [
      {
        id: "page_home",
        projectId,
        siteId: null,
        url: "https://demo.pagecraft.dev",
        path: "/",
        title: "PageCraft Home",
        status: "captured",
        createdAt,
        updatedAt: createdAt,
        screenshotUrl: buildPlaceholderThumbnail("PageCraft Home"),
        metadata: {
          canonicalUrl: "https://demo.pagecraft.dev",
          description: "Convert websites into editable design systems.",
          lang: "en"
        },
        lastCaptureAt: createdAt,
        lastCaptureId: "capture_page_home"
      },
      {
        id: "page_pricing",
        projectId,
        siteId: null,
        url: "https://demo.pagecraft.dev/pricing",
        path: "/pricing",
        title: "Pricing",
        status: "captured",
        createdAt,
        updatedAt: createdAt,
        screenshotUrl: buildPlaceholderThumbnail("Pricing"),
        metadata: {
          canonicalUrl: "https://demo.pagecraft.dev/pricing",
          description: "Simple SaaS pricing tiers.",
          lang: "en"
        },
        lastCaptureAt: createdAt,
        lastCaptureId: "capture_page_pricing"
      },
      {
        id: "page_docs",
        projectId,
        siteId: null,
        url: "https://demo.pagecraft.dev/docs",
        path: "/docs",
        title: "Docs",
        status: "captured",
        createdAt,
        updatedAt: createdAt,
        screenshotUrl: buildPlaceholderThumbnail("Docs"),
        metadata: {
          canonicalUrl: "https://demo.pagecraft.dev/docs",
          description: "Developer docs and guides.",
          lang: "en"
        },
        lastCaptureAt: createdAt,
        lastCaptureId: "capture_page_docs"
      }
    ],
    captures: [
      {
        id: "capture_page_home",
        projectId,
        pageId: "page_home",
        mode: "page",
        source: "extension",
        status: "completed",
        createdAt,
        updatedAt: createdAt,
        screenshotUrl: buildPlaceholderThumbnail("PageCraft Home"),
        serializedPage: null,
        normalized: createDemoCapture("page_home", "https://demo.pagecraft.dev", "PageCraft Home")
      },
      {
        id: "capture_page_pricing",
        projectId,
        pageId: "page_pricing",
        mode: "page",
        source: "url",
        status: "completed",
        createdAt,
        updatedAt: createdAt,
        screenshotUrl: buildPlaceholderThumbnail("Pricing"),
        serializedPage: null,
        normalized: createDemoCapture("page_pricing", "https://demo.pagecraft.dev/pricing", "Simple Pricing")
      },
      {
        id: "capture_page_docs",
        projectId,
        pageId: "page_docs",
        mode: "style-guide",
        source: "url",
        status: "completed",
        createdAt,
        updatedAt: createdAt,
        screenshotUrl: buildPlaceholderThumbnail("Docs"),
        serializedPage: null,
        normalized: createDemoCapture("page_docs", "https://demo.pagecraft.dev/docs", "Developer Docs")
      }
    ],
    jobs: [
      {
        id: "job_capture_seed",
        kind: "capture",
        status: "completed",
        projectId,
        pageId: "page_home",
        crawlRunId: null,
        pageUrl: "https://demo.pagecraft.dev",
        sourceUrl: "https://demo.pagecraft.dev",
        progress: 1,
        message: "Initial capture complete.",
        errorMessage: null,
        payload: {},
        createdAt,
        updatedAt: createdAt
      },
      {
        id: "job_crawl_seed",
        kind: "crawl",
        status: "completed",
        projectId,
        pageId: null,
        crawlRunId: "crawl_demo",
        pageUrl: null,
        sourceUrl: "https://demo.pagecraft.dev",
        progress: 1,
        message: "Initial crawl completed.",
        errorMessage: null,
        payload: {},
        createdAt,
        updatedAt: createdAt
      }
    ],
    crawlRuns: [
      {
        id: "crawl_demo",
        projectId,
        siteOrigin: "https://demo.pagecraft.dev",
        seedUrl: "https://demo.pagecraft.dev",
        status: "completed",
        maxDepth: 2,
        maxPages: 20,
        createdAt,
        updatedAt: createdAt
      }
    ],
    crawlRoutes: [
      {
        id: "route_home",
        crawlRunId: "crawl_demo",
        url: "https://demo.pagecraft.dev",
        pathname: "/",
        depth: 0,
        status: "visited",
        pageId: "page_home",
        skipReason: null
      },
      {
        id: "route_pricing",
        crawlRunId: "crawl_demo",
        url: "https://demo.pagecraft.dev/pricing",
        pathname: "/pricing",
        depth: 1,
        status: "visited",
        pageId: "page_pricing",
        skipReason: null
      },
      {
        id: "route_docs",
        crawlRunId: "crawl_demo",
        url: "https://demo.pagecraft.dev/docs",
        pathname: "/docs",
        depth: 1,
        status: "visited",
        pageId: "page_docs",
        skipReason: null
      }
    ],
    styles: [
      {
        id: "style_primary",
        projectId,
        pageId: null,
        name: "colors.primary.500",
        kind: "color",
        collection: "core",
        value: "#155EEF",
        description: "Primary action blue.",
        fingerprint: "color:155eef"
      },
      {
        id: "style_heading",
        projectId,
        pageId: null,
        name: "typography.heading.h1",
        kind: "typography",
        collection: "core",
        value: {
          fontFamily: "Inter",
          fontStyle: "Bold",
          fontWeight: 700,
          fontSize: 42,
          lineHeight: 52,
          color: "#172132"
        },
        description: null,
        fingerprint: "typography:h1"
      },
      {
        id: "style_spacing",
        projectId,
        pageId: null,
        name: "spacing.6",
        kind: "spacing",
        collection: "core",
        value: 24,
        description: null,
        fingerprint: "spacing:24"
      },
      {
        id: "style_radius",
        projectId,
        pageId: null,
        name: "radius.lg",
        kind: "radius",
        collection: "core",
        value: 24,
        description: null,
        fingerprint: "radius:24"
      }
    ],
    patterns: [
      {
        id: "pattern_button_primary",
        projectId,
        pageIds: ["page_home", "page_pricing"],
        name: "Primary Button",
        kind: "button",
        status: "validated",
        fingerprint: "button:primary",
        confidence: 0.91,
        description: "Primary CTA button repeated across marketing pages.",
        sampleNodeIds: ["button_page_home"],
        sampleNodes: []
      },
      {
        id: "pattern_feature_card",
        projectId,
        pageIds: ["page_home", "page_docs"],
        name: "Feature Card",
        kind: "card",
        status: "validated",
        fingerprint: "cards:grid",
        confidence: 0.82,
        description: "Card group used in feature and doc summary sections.",
        sampleNodeIds: ["cards_page_home"],
        sampleNodes: []
      },
      {
        id: "pattern_top_nav",
        projectId,
        pageIds: ["page_home", "page_pricing", "page_docs"],
        name: "Top Navigation",
        kind: "navigation",
        status: "validated",
        fingerprint: "nav:top",
        confidence: 0.88,
        description: "Top-level nav shell repeated across pages.",
        sampleNodeIds: [],
        sampleNodes: []
      }
    ],
    warnings: [
      {
        id: "warning_font_fallback",
        projectId,
        pageId: "page_pricing",
        jobId: "job_capture_seed",
        severity: "warning",
        code: "FONT_FALLBACK",
        message: "Pricing page used a fallback font during import normalization.",
        context: null
      }
    ]
  };
}
