import { describe, expect, it } from "vitest";

import { mapExportBundleToPlan } from "./export-mapper";

describe("export mapper", () => {
  it("groups tokens, patterns, nodes, and warnings into an import plan", () => {
    const projectBundle = {
      project: {
        id: "project-1",
        name: "PageCraft",
        slug: "pagecraft",
        status: "active" as const,
        description: null
      },
      pages: [
        {
          id: "page-1",
          projectId: "project-1",
          siteId: "site-1",
          url: "https://example.com",
          path: "/",
          title: "Home",
          status: "captured",
          updatedAt: null
        }
      ],
      styles: [
        {
          id: "token-1",
          name: "colors.primary.500",
          kind: "color" as const,
          collection: "core",
          value: "#3366FF",
          description: null,
          fingerprint: "token-1"
        },
        {
          id: "token-2",
          name: "typography.heading.h1",
          kind: "typography" as const,
          collection: "core",
          value: { fontFamily: "Inter", fontSize: 40 },
          description: null,
          fingerprint: "token-2"
        }
      ],
      patterns: [
        {
          id: "pattern-1",
          name: "primary button",
          kind: "button" as const,
          status: "validated",
          fingerprint: "pattern-1",
          confidence: 0.82,
          description: null,
          sampleNodeIds: [],
          sampleNodes: []
        }
      ],
      warnings: [
        {
          id: "warning-1",
          severity: "warning" as const,
          code: "FONT_FALLBACK",
          message: "A fallback font was used.",
          context: null
        }
      ],
      assets: [],
      generatedAt: "2026-03-15T12:00:00.000Z"
    };

    const pageBundle = {
      project: projectBundle.project,
      page: projectBundle.pages[0],
      capture: {
        id: "capture-1",
        pageId: "page-1",
        url: "https://example.com",
        title: "Home",
        viewport: { width: 1440, height: 900 },
        nodes: [
          {
            id: "node-1",
            type: "frame",
            htmlTag: "main",
            name: "Main",
            role: null,
            textContent: null,
            x: 0,
            y: 0,
            width: 900,
            height: 800,
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
            selector: "main",
            sourcePath: "root",
            children: [],
            inferredFingerprint: "node-1"
          }
        ],
        warnings: [],
        capturedAt: "2026-03-15T12:00:00.000Z"
      },
      styles: [],
      patterns: [],
      warnings: [],
      assets: [],
      generatedAt: "2026-03-15T12:00:00.000Z"
    };

    const plan = mapExportBundleToPlan(projectBundle, pageBundle, {
      mode: "editable",
      options: {
        includeImages: true,
        createComponents: true,
        createVariables: false
      }
    });

    expect(plan.tokens.colors).toHaveLength(1);
    expect(plan.tokens.typography).toHaveLength(1);
    expect(plan.componentCandidates[0]?.name).toBe("Primary Button");
    expect(plan.pageNodes).toHaveLength(1);
    expect(plan.coverNotes).toContain("Mode: editable");
  });
});
