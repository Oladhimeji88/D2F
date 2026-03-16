import type { NormalizedNode } from "@pagecraft/shared-types";

import { componentNameFromPattern } from "../helpers/naming";
import type { ImportPlan, ImportSettings } from "../types";
import { FigmaNodeFactory } from "./node-factory";

async function addLabel(node: ComponentNode, label: string) {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  const text = figma.createText();
  text.characters = label;
  text.fontSize = 12;
  text.y = node.height + 8;
  node.appendChild(text);
}

function semanticFallbackNodes(kind: string): NormalizedNode[] {
  if (kind === "button") {
    return [
      {
        id: "fallback-button",
        type: "frame",
        htmlTag: "button",
        name: "Button",
        role: "button",
        textContent: null,
        x: 0,
        y: 0,
        width: 180,
        height: 48,
        visible: true,
        opacity: 1,
        zIndex: null,
        fills: [{ type: "SOLID", color: { r: 0.1, g: 0.31, b: 0.72, a: 1 }, opacity: 1, imageUrl: null, blendMode: null }],
        strokes: [],
        cornerRadius: 12,
        shadows: [],
        typography: null,
        layout: { mode: "HORIZONTAL", wrap: "NO_WRAP", justifyContent: "CENTER", alignItems: "CENTER", alignSelf: null, positionType: "AUTO", sizingHorizontal: null, sizingVertical: null },
        padding: { top: 12, right: 20, bottom: 12, left: 20 },
        gap: 8,
        alignment: null,
        constraints: null,
        imageRef: null,
        svgRef: null,
        selector: "button",
        sourcePath: null,
        children: [
          {
            id: "fallback-button-label",
            type: "text",
            htmlTag: "#text",
            name: "Label",
            role: null,
            textContent: "Primary action",
            x: 0,
            y: 0,
            width: 120,
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
              fontStyle: "Medium",
              fontWeight: 500,
              fontSize: 16,
              lineHeight: 24,
              letterSpacing: 0,
              textAlignHorizontal: "CENTER",
              textAlignVertical: "CENTER",
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
            sourcePath: null,
            children: [],
            inferredFingerprint: null
          }
        ],
        inferredFingerprint: "fallback-button"
      }
    ];
  }

  if (kind === "card") {
    return [
      {
        id: "fallback-card",
        type: "frame",
        htmlTag: "article",
        name: "Card",
        role: null,
        textContent: null,
        x: 0,
        y: 0,
        width: 280,
        height: 180,
        visible: true,
        opacity: 1,
        zIndex: null,
        fills: [{ type: "SOLID", color: { r: 1, g: 1, b: 1, a: 1 }, opacity: 1, imageUrl: null, blendMode: null }],
        strokes: [{ type: "SOLID", color: { r: 0.88, g: 0.9, b: 0.94, a: 1 }, opacity: 1, imageUrl: null, blendMode: null }],
        cornerRadius: 20,
        shadows: [{ x: 0, y: 14, blur: 32, spread: 0, color: { r: 0, g: 0, b: 0, a: 0.08 }, inset: false }],
        typography: null,
        layout: { mode: "VERTICAL", wrap: "NO_WRAP", justifyContent: null, alignItems: null, alignSelf: null, positionType: "AUTO", sizingHorizontal: null, sizingVertical: null },
        padding: { top: 20, right: 20, bottom: 20, left: 20 },
        gap: 12,
        alignment: null,
        constraints: null,
        imageRef: null,
        svgRef: null,
        selector: "article",
        sourcePath: null,
        children: [],
        inferredFingerprint: "fallback-card"
      }
    ];
  }

  return [
    {
      id: `fallback-${kind}`,
      type: "frame",
      htmlTag: "div",
      name: componentNameFromPattern(
        {
          id: `pattern-${kind}`,
          name: kind,
          kind: "generic",
          status: "validated",
          fingerprint: `pattern-${kind}`,
          confidence: 0.5,
          description: null,
          sampleNodeIds: [],
          sampleNodes: []
        },
        0
      ),
      role: null,
      textContent: null,
      x: 0,
      y: 0,
      width: 220,
      height: 120,
      visible: true,
      opacity: 1,
      zIndex: null,
      fills: [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.99, a: 1 }, opacity: 1, imageUrl: null, blendMode: null }],
      strokes: [],
      cornerRadius: 18,
      shadows: [],
      typography: null,
      layout: null,
      padding: null,
      gap: null,
      alignment: null,
      constraints: null,
      imageRef: null,
      svgRef: null,
      selector: "div",
      sourcePath: null,
      children: [],
      inferredFingerprint: `fallback-${kind}`
    }
  ];
}

export async function buildComponentsPage(
  targetPage: PageNode,
  plan: ImportPlan,
  settings: ImportSettings,
  warnings: string[]
): Promise<number> {
  const root = figma.createFrame();
  root.name = "Components";
  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "AUTO";
  root.itemSpacing = 32;
  root.paddingTop = 40;
  root.paddingRight = 40;
  root.paddingBottom = 40;
  root.paddingLeft = 40;
  root.fills = [{ type: "SOLID", color: { r: 0.99, g: 0.99, b: 1 } }];

  const factory = new FigmaNodeFactory(settings, plan.projectBundle.assets, warnings);
  let created = 0;

  for (const candidate of plan.componentCandidates) {
    const component = figma.createComponent();
    component.name = candidate.name;
    component.resize(320, 200);

    const nodes = candidate.sampleNodes.length > 0 ? candidate.sampleNodes : semanticFallbackNodes(candidate.kind);
    created += await factory.createNodes(nodes, component);
    await addLabel(component, candidate.warning ?? `${candidate.kind} · ${Math.round(candidate.confidence * 100)}% confidence`);
    root.appendChild(component);
    created += 1;
  }

  targetPage.appendChild(root);
  root.x = 0;
  root.y = 0;
  return created;
}
