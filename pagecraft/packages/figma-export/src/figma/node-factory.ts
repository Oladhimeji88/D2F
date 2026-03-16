import type { ExportAsset, NormalizedNode } from "@pagecraft/shared-types";

import { inferAutoLayout, sortChildrenForLayout } from "../helpers/layout";
import type { ImportSettings } from "../types";
import { applyImageFill } from "./image";
import { loadFontWithFallback } from "./font";
import { createNodeFromSvgMarkup } from "./vector";

function clampSize(value: number): number {
  return Math.max(1, Math.round(value || 1));
}

function isTextNode(node: NormalizedNode): boolean {
  return node.type.toLowerCase().includes("text") || node.htmlTag === "#text" || Boolean(node.textContent);
}

function isFrameLike(node: SceneNode): node is FrameNode | ComponentNode {
  return node.type === "FRAME" || node.type === "COMPONENT";
}

function applyCornerRadius(target: RectangleNode | FrameNode, node: NormalizedNode) {
  if (node.cornerRadius !== null) {
    target.cornerRadius = node.cornerRadius;
  }
}

function applyEffects(target: RectangleNode | FrameNode, node: NormalizedNode) {
  if (node.shadows.length === 0) {
    return;
  }

  target.effects = node.shadows.map((shadow) => ({
    type: "DROP_SHADOW",
    color: shadow.color,
    offset: {
      x: shadow.x,
      y: shadow.y
    },
    radius: shadow.blur,
    spread: shadow.spread,
    visible: true,
    blendMode: "NORMAL"
  }));
}

function applyFills(target: GeometryMixin, node: NormalizedNode) {
  if (node.fills.length === 0) {
    return;
  }

  const solidFills = node.fills
    .filter((fill) => fill.type === "SOLID" && fill.color)
    .map((fill) => ({
      type: "SOLID" as const,
      color: {
        r: fill.color?.r ?? 0,
        g: fill.color?.g ?? 0,
        b: fill.color?.b ?? 0
      },
      opacity: fill.opacity
    }));

  if (solidFills.length > 0) {
    target.fills = solidFills;
  }
}

function applyStrokes(target: GeometryMixin, node: NormalizedNode) {
  if (node.strokes.length === 0) {
    return;
  }

  const solidStrokes = node.strokes
    .filter((stroke) => stroke.type === "SOLID" && stroke.color)
    .map((stroke) => ({
      type: "SOLID" as const,
      color: {
        r: stroke.color?.r ?? 0,
        g: stroke.color?.g ?? 0,
        b: stroke.color?.b ?? 0
      },
      opacity: stroke.opacity
    }));

  if (solidStrokes.length > 0) {
    target.strokes = solidStrokes;
    target.strokeWeight = 1;
  }
}

function assetUrl(node: NormalizedNode, assets: Map<string, ExportAsset>): string | null {
  if (!node.imageRef) {
    return null;
  }

  const asset = assets.get(node.imageRef);
  return asset?.url ?? node.imageRef;
}

export class FigmaNodeFactory {
  private readonly assetMap: Map<string, ExportAsset>;

  constructor(
    private readonly settings: ImportSettings,
    assets: ExportAsset[],
    private readonly warnings: string[]
  ) {
    this.assetMap = new Map(assets.map((asset) => [asset.id, asset]));
  }

  async createNodes(nodes: NormalizedNode[], parent: BaseNode & ChildrenMixin, withinAutoLayout = false): Promise<number> {
    let created = 0;

    for (const node of nodes) {
      const sceneNode = await this.createNode(node, withinAutoLayout);
      if (!sceneNode) {
        continue;
      }

      parent.appendChild(sceneNode);
      created += 1;

      if (node.children.length > 0 && "appendChild" in sceneNode && isFrameLike(sceneNode)) {
        const layout = inferAutoLayout(node);
        const childAutoLayout = this.settings.mode === "editable" && layout.mode !== "NONE" && layout.confidence >= 0.55;
        created += await this.createNodes(
          childAutoLayout ? sortChildrenForLayout(node, layout.mode) : node.children,
          sceneNode,
          childAutoLayout
        );
      }
    }

    return created;
  }

  async createNode(node: NormalizedNode, withinAutoLayout = false): Promise<SceneNode | null> {
    if (node.svgRef) {
      const svgNode = createNodeFromSvgMarkup(node.svgRef, this.warnings);
      if (svgNode) {
        this.applyGeometry(svgNode, node, withinAutoLayout);
        return svgNode;
      }
    }

    if (isTextNode(node)) {
      const textNode = figma.createText();
      const fontName = await loadFontWithFallback(node.typography, this.warnings);
      textNode.fontName = fontName;
      textNode.characters = node.textContent ?? node.name ?? "";
      textNode.fontSize = node.typography?.fontSize ?? 16;
      if (node.typography?.lineHeight) {
        textNode.lineHeight = {
          unit: "PIXELS",
          value: node.typography.lineHeight
        };
      }
      if (node.typography?.letterSpacing !== null && node.typography?.letterSpacing !== undefined) {
        textNode.letterSpacing = {
          unit: "PIXELS",
          value: node.typography.letterSpacing
        };
      }
      textNode.textAutoResize = this.settings.mode === "faithful" ? "NONE" : "HEIGHT";
      this.applyGeometry(textNode, node, withinAutoLayout);
      return textNode;
    }

    const layout = inferAutoLayout(node);
    const useAutoLayout = this.settings.mode === "editable" && layout.mode !== "NONE" && layout.confidence >= 0.55 && node.children.length > 0;
    const sceneNode = node.children.length > 0 ? figma.createFrame() : figma.createRectangle();

    sceneNode.name = node.name ?? node.htmlTag ?? node.id;
    sceneNode.opacity = node.opacity;

    if (sceneNode.type === "FRAME") {
      sceneNode.clipsContent = false;
      if (useAutoLayout) {
        sceneNode.layoutMode = layout.mode;
        sceneNode.primaryAxisSizingMode = "AUTO";
        sceneNode.counterAxisSizingMode = "AUTO";
        sceneNode.itemSpacing = layout.gap;
        sceneNode.paddingTop = layout.padding.top;
        sceneNode.paddingRight = layout.padding.right;
        sceneNode.paddingBottom = layout.padding.bottom;
        sceneNode.paddingLeft = layout.padding.left;
      }
    }

    applyCornerRadius(sceneNode, node);
    applyEffects(sceneNode, node);

    if ("fills" in sceneNode) {
      applyFills(sceneNode, node);
      applyStrokes(sceneNode, node);
    }

    this.applyGeometry(sceneNode, node, withinAutoLayout || useAutoLayout);

    const resolvedImageUrl = this.settings.options.includeImages ? assetUrl(node, this.assetMap) : null;
    if (resolvedImageUrl && (sceneNode.type === "RECTANGLE" || sceneNode.type === "FRAME")) {
      await applyImageFill(sceneNode, resolvedImageUrl, this.warnings);
    }

    return sceneNode;
  }

  private applyGeometry(node: SceneNode, source: NormalizedNode, withinAutoLayout: boolean) {
    if ("resize" in node && typeof node.resize === "function") {
      node.resize(clampSize(source.width), clampSize(source.height));
    }

    if (!withinAutoLayout && "x" in node && "y" in node) {
      node.x = source.x;
      node.y = source.y;
    }
  }
}
