import type { StyleToken, WarningLog } from "@pagecraft/shared-types";

import type { ImportPlan } from "../types";
import { parseColorString, rgbaToHex, rgbaToPaint } from "../helpers/color";
import { loadFontWithFallback } from "./font";

function createSection(title: string): FrameNode {
  const section = figma.createFrame();
  section.name = title;
  section.layoutMode = "VERTICAL";
  section.primaryAxisSizingMode = "AUTO";
  section.counterAxisSizingMode = "AUTO";
  section.itemSpacing = 16;
  section.fills = [];

  const heading = figma.createText();
  heading.characters = title;
  heading.fontSize = 24;
  heading.fontName = { family: "Inter", style: "Bold" };
  section.appendChild(heading);

  return section;
}

async function createSectionHeading(text: TextNode, label: string) {
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });
  text.characters = label;
  text.fontName = { family: "Inter", style: "Bold" };
  text.fontSize = 24;
}

function tokenValueRecord(token: StyleToken): Record<string, unknown> | null {
  return typeof token.value === "object" && token.value !== null ? (token.value as Record<string, unknown>) : null;
}

function appendWarningNotes(section: FrameNode, warnings: WarningLog[]) {
  for (const warning of warnings) {
    const note = figma.createText();
    note.characters = `${warning.severity.toUpperCase()}: ${warning.message}`;
    note.fontSize = 12;
    note.fills = [{ type: "SOLID", color: { r: 0.72, g: 0.14, b: 0.18 } }];
    section.appendChild(note);
  }
}

export async function buildStyleGuidePage(targetPage: PageNode, plan: ImportPlan): Promise<FrameNode> {
  await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  await figma.loadFontAsync({ family: "Inter", style: "Bold" });

  const root = figma.createFrame();
  root.name = "Style Guide";
  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "AUTO";
  root.itemSpacing = 40;
  root.paddingTop = 48;
  root.paddingRight = 48;
  root.paddingBottom = 48;
  root.paddingLeft = 48;
  root.fills = [{ type: "SOLID", color: { r: 0.985, g: 0.985, b: 0.985 } }];
  root.resize(1440, 10);

  const header = figma.createText();
  await createSectionHeading(header, `${plan.projectBundle.project.name} Style Guide`);
  root.appendChild(header);

  const colorSection = createSection("Color Palette");
  for (const token of plan.tokens.colors) {
    const parsedColor =
      typeof token.value === "string"
        ? parseColorString(token.value)
        : parseColorString(typeof tokenValueRecord(token)?.hex === "string" ? (tokenValueRecord(token)?.hex as string) : null);
    if (!parsedColor) {
      continue;
    }

    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "AUTO";
    row.itemSpacing = 16;
    row.fills = [];

    const swatch = figma.createRectangle();
    swatch.resize(96, 96);
    swatch.cornerRadius = 16;
    swatch.fills = [rgbaToPaint(parsedColor)];
    row.appendChild(swatch);

    const labelColumn = figma.createFrame();
    labelColumn.layoutMode = "VERTICAL";
    labelColumn.primaryAxisSizingMode = "AUTO";
    labelColumn.counterAxisSizingMode = "AUTO";
    labelColumn.itemSpacing = 4;
    labelColumn.fills = [];

    const label = figma.createText();
    label.characters = token.name;
    label.fontSize = 16;
    labelColumn.appendChild(label);

    const hex = figma.createText();
    hex.characters = rgbaToHex(parsedColor);
    hex.fontSize = 12;
    hex.opacity = 0.72;
    labelColumn.appendChild(hex);

    row.appendChild(labelColumn);
    colorSection.appendChild(row);
  }
  root.appendChild(colorSection);

  const typographySection = createSection("Typography");
  for (const token of plan.tokens.typography) {
    const value = tokenValueRecord(token);
    const text = figma.createText();
    const fontName = await loadFontWithFallback(
      {
        fontFamily: typeof value?.fontFamily === "string" ? value.fontFamily : "Inter",
        fontStyle: typeof value?.fontStyle === "string" ? value.fontStyle : "Regular",
        fontWeight: typeof value?.fontWeight === "number" ? value.fontWeight : 400,
        fontSize: typeof value?.fontSize === "number" ? value.fontSize : 20,
        lineHeight: typeof value?.lineHeight === "number" ? value.lineHeight : 28,
        letterSpacing: typeof value?.letterSpacing === "number" ? value.letterSpacing : 0,
        textAlignHorizontal: null,
        textAlignVertical: null,
        textTransform: null,
        textDecoration: null
      },
      []
    );

    text.fontName = fontName;
    text.characters = `${token.name} — The quick brown fox jumps over the lazy dog`;
    text.fontSize = typeof value?.fontSize === "number" ? value.fontSize : 20;
    typographySection.appendChild(text);
  }
  root.appendChild(typographySection);

  const spacingSection = createSection("Spacing");
  for (const token of plan.tokens.spacing) {
    const row = figma.createFrame();
    row.layoutMode = "HORIZONTAL";
    row.primaryAxisSizingMode = "AUTO";
    row.counterAxisSizingMode = "AUTO";
    row.itemSpacing = 16;
    row.fills = [];

    const label = figma.createText();
    label.characters = token.name;
    row.appendChild(label);

    const size = figma.createRectangle();
    const numericValue =
      typeof token.value === "number"
        ? token.value
        : typeof tokenValueRecord(token)?.value === "number"
          ? (tokenValueRecord(token)?.value as number)
          : 8;
    size.resize(Math.max(8, numericValue), 24);
    size.cornerRadius = 12;
    size.fills = [{ type: "SOLID", color: { r: 0.13, g: 0.34, b: 0.74 }, opacity: 0.18 }];
    row.appendChild(size);

    spacingSection.appendChild(row);
  }
  root.appendChild(spacingSection);

  const radiusSection = createSection("Radius");
  for (const token of plan.tokens.radius) {
    const card = figma.createRectangle();
    const radiusValue =
      typeof token.value === "number"
        ? token.value
        : typeof tokenValueRecord(token)?.value === "number"
          ? (tokenValueRecord(token)?.value as number)
          : 8;
    card.resize(160, 72);
    card.cornerRadius = radiusValue;
    card.fills = [{ type: "SOLID", color: { r: 0.97, g: 0.97, b: 0.99 } }];
    radiusSection.appendChild(card);
  }
  root.appendChild(radiusSection);

  const shadowSection = createSection("Shadow");
  for (const token of plan.tokens.shadow) {
    const tile = figma.createRectangle();
    tile.resize(160, 72);
    tile.cornerRadius = 16;
    tile.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];
    tile.effects = [
      {
        type: "DROP_SHADOW",
        color: { r: 0, g: 0, b: 0, a: 0.16 },
        offset: { x: 0, y: 12 },
        radius: 24,
        visible: true,
        blendMode: "NORMAL"
      }
    ];
    const label = figma.createText();
    label.characters = token.name;
    shadowSection.appendChild(tile);
    shadowSection.appendChild(label);
  }
  root.appendChild(shadowSection);

  const componentsSection = createSection("Core Component Examples");
  for (const component of plan.componentCandidates.slice(0, 4)) {
    const chip = figma.createFrame();
    chip.layoutMode = "HORIZONTAL";
    chip.primaryAxisSizingMode = "AUTO";
    chip.counterAxisSizingMode = "AUTO";
    chip.itemSpacing = 12;
    chip.paddingTop = 10;
    chip.paddingRight = 14;
    chip.paddingBottom = 10;
    chip.paddingLeft = 14;
    chip.cornerRadius = 14;
    chip.fills = [{ type: "SOLID", color: { r: 0.96, g: 0.97, b: 0.99 } }];

    const label = figma.createText();
    label.characters = `${component.name} (${Math.round(component.confidence * 100)}%)`;
    chip.appendChild(label);
    componentsSection.appendChild(chip);
  }
  root.appendChild(componentsSection);

  const notesSection = createSection("Summary Notes");
  for (const noteText of plan.coverNotes) {
    const note = figma.createText();
    note.characters = noteText;
    note.fontSize = 14;
    notesSection.appendChild(note);
  }
  appendWarningNotes(notesSection, plan.warnings);
  root.appendChild(notesSection);

  targetPage.appendChild(root);
  root.x = 0;
  root.y = 0;
  return root;
}
