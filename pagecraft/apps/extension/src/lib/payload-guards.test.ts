import { describe, expect, it } from "vitest";

import { enforcePayloadBudget } from "./payload-guards";

describe("enforcePayloadBudget", () => {
  it("trims nodes and emits a truncation warning when payload exceeds the byte budget", () => {
    const payload = {
      url: "https://example.com/page",
      origin: "https://example.com",
      title: "Example",
      viewport: {
        width: 1280,
        height: 720
      },
      meta: {
        description: null,
        canonicalUrl: null,
        lang: "en"
      },
      links: [],
      nodes: [
        {
          id: "root/section[1]",
          type: "element" as const,
          tagName: "section",
          role: null,
          text: null,
          rect: { x: 0, y: 0, width: 100, height: 50 },
          styles: {
            color: "rgb(0, 0, 0)",
            backgroundColor: null,
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
          selector: "section",
          warnings: [],
          children: Array.from({ length: 15 }, (_, index) => ({
            id: `child-${index}`,
            type: "text" as const,
            tagName: "#text",
            role: null,
            text: "x".repeat(60),
            rect: { x: 0, y: 0, width: 100, height: 20 },
            styles: {
              color: "rgb(0, 0, 0)",
              backgroundColor: null,
              fontFamily: "Inter",
              fontSize: "16px",
              fontWeight: "400",
              lineHeight: "24px",
              letterSpacing: "0px",
              display: "inline",
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
            selector: null,
            warnings: [],
            children: []
          }))
        }
      ],
      images: [],
      warnings: [],
      truncated: false,
      estimatedBytes: 0
    };

    const result = enforcePayloadBudget(payload, 1600);

    const sourceNode = payload.nodes[0];
    const resultNode = result.nodes[0];

    expect(result.truncated).toBe(true);
    expect(result.warnings).toContain("Payload truncated to fit extension transport budget.");
    expect(sourceNode).toBeDefined();
    expect(resultNode).toBeDefined();
    expect(resultNode?.children.length ?? 0).toBeLessThan(sourceNode?.children.length ?? 0);
  });
});
