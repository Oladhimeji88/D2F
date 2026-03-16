import { beforeEach, describe, expect, it } from "vitest";

import { serializeVisiblePage } from "./dom-serializer";

function setRect(element: Element, rect: Partial<DOMRect>) {
  Object.defineProperty(element, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: rect.x ?? 0,
      y: rect.y ?? 0,
      width: rect.width ?? 0,
      height: rect.height ?? 0,
      top: rect.y ?? 0,
      left: rect.x ?? 0,
      right: (rect.x ?? 0) + (rect.width ?? 0),
      bottom: (rect.y ?? 0) + (rect.height ?? 0),
      toJSON: () => ({})
    })
  });
}

describe("serializeVisiblePage", () => {
  beforeEach(() => {
    document.documentElement.lang = "en";
    document.title = "Serializer test";
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: 1440
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 900
    });
  });

  it("serializes visible elements, text, images, and excludes hidden/script nodes", () => {
    document.body.innerHTML = `
      <main id="root">
        <h1>PageCraft</h1>
        <p class="intro">Convert pages into editable design systems.</p>
        <img id="hero" src="https://example.com/hero.png" alt="Hero" />
        <div id="hidden" style="display: none;">Hidden</div>
        <script>console.log("skip")</script>
      </main>
    `;

    const main = document.querySelector("main");
    const heading = document.querySelector("h1");
    const paragraph = document.querySelector("p");
    const image = document.querySelector("img");
    const hidden = document.querySelector("#hidden");

    setRect(main!, { x: 0, y: 0, width: 900, height: 700 });
    setRect(heading!, { x: 24, y: 24, width: 400, height: 64 });
    setRect(paragraph!, { x: 24, y: 110, width: 520, height: 48 });
    setRect(image!, { x: 24, y: 180, width: 640, height: 320 });
    setRect(hidden!, { x: 0, y: 0, width: 0, height: 0 });

    const payload = serializeVisiblePage(document, { maxNodes: 20, maxBytes: 50_000 });
    const rootNode = payload.nodes[0];

    expect(payload.title).toBe("Serializer test");
    expect(payload.images).toContain("https://example.com/hero.png");
    expect(payload.links.map((link) => link.url)).toContain("https://example.com/current");
    expect(rootNode).toBeDefined();
    expect(rootNode?.children.some((child) => child.tagName === "script")).toBe(false);
    expect(rootNode?.children.some((child) => child.idAttr === "hidden")).toBe(false);
    expect(rootNode?.children.some((child) => child.tagName === "img")).toBe(true);
    expect(rootNode?.children.some((child) => child.type === "text")).toBe(true);
  });
});
