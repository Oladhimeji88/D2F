import type { PluginImportOptions, StyleToken } from "@pagecraft/shared-types";

import { parseColorString, rgbaToPaint } from "../helpers/color";
import { tokenStyleName } from "../helpers/naming";

function findPaintStyleByName(name: string): PaintStyle | undefined {
  return figma.getLocalPaintStyles().find((style) => style.name === name);
}

function findTextStyleByName(name: string): TextStyle | undefined {
  return figma.getLocalTextStyles().find((style) => style.name === name);
}

function tokenValueRecord(token: StyleToken): Record<string, unknown> | null {
  return typeof token.value === "object" && token.value !== null ? (token.value as Record<string, unknown>) : null;
}

export async function upsertPaintStyle(token: StyleToken, warnings: string[]): Promise<PaintStyle | null> {
  const name = tokenStyleName(token);
  const colorValue =
    typeof token.value === "string"
      ? parseColorString(token.value)
      : parseColorString(typeof tokenValueRecord(token)?.hex === "string" ? (tokenValueRecord(token)?.hex as string) : null);

  if (!colorValue) {
    warnings.push(`Token ${token.name} could not be converted into a paint style.`);
    return null;
  }

  const style = findPaintStyleByName(name) ?? figma.createPaintStyle();
  style.name = name;
  style.paints = [rgbaToPaint(colorValue)];
  return style;
}

export async function upsertTextStyle(token: StyleToken, warnings: string[]): Promise<TextStyle | null> {
  const value = tokenValueRecord(token);
  const fontFamily = typeof value?.fontFamily === "string" ? value.fontFamily : "Inter";
  const fontStyle = typeof value?.fontStyle === "string" ? value.fontStyle : "Regular";

  try {
    await figma.loadFontAsync({ family: fontFamily, style: fontStyle });
  } catch {
    warnings.push(`Text style ${token.name} could not load font ${fontFamily} ${fontStyle}.`);
    await figma.loadFontAsync({ family: "Inter", style: "Regular" });
  }

  const style = findTextStyleByName(tokenStyleName(token)) ?? figma.createTextStyle();
  style.name = tokenStyleName(token);
  style.fontName = { family: fontFamily, style: fontStyle };
  style.fontSize = typeof value?.fontSize === "number" ? value.fontSize : 16;
  style.lineHeight = {
    unit: "PIXELS",
    value: typeof value?.lineHeight === "number" ? value.lineHeight : Math.round(style.fontSize * 1.4)
  };

  if (typeof value?.letterSpacing === "number") {
    style.letterSpacing = {
      unit: "PIXELS",
      value: value.letterSpacing
    };
  }

  if (typeof value?.color === "string") {
    const parsed = parseColorString(value.color);
    if (parsed) {
      style.fills = [rgbaToPaint(parsed)];
    }
  }

  return style;
}

export async function syncLocalStyles(
  tokens: StyleToken[],
  options: PluginImportOptions,
  warnings: string[]
): Promise<{
  paintStylesCreated: number;
  textStylesCreated: number;
  variablesCreated: number;
}> {
  let paintStylesCreated = 0;
  let textStylesCreated = 0;
  let variablesCreated = 0;

  for (const token of tokens) {
    if (token.kind === "color") {
      const style = await upsertPaintStyle(token, warnings);
      if (style) {
        paintStylesCreated += 1;
      }

      if (options.createVariables && "variables" in figma) {
        try {
          const collection = figma.variables.getLocalVariableCollections().find((item) => item.name === "PageCraft Colors")
            ?? figma.variables.createVariableCollection("PageCraft Colors");
          const variableName = tokenStyleName(token).replace(/\//g, ".");
          const variable =
            figma.variables.getLocalVariables().find((item) => item.name === variableName)
            ?? figma.variables.createVariable(variableName, collection, "COLOR");

          const value = typeof token.value === "string" ? parseColorString(token.value) : null;
          if (value) {
            variable.setValueForMode(collection.modes[0].modeId, {
              r: value.r,
              g: value.g,
              b: value.b,
              a: value.a
            });
            variablesCreated += 1;
          }
        } catch (error) {
          warnings.push(error instanceof Error ? error.message : `Variable creation failed for ${token.name}.`);
        }
      }
    }

    if (token.kind === "typography") {
      const style = await upsertTextStyle(token, warnings);
      if (style) {
        textStylesCreated += 1;
      }
    }
  }

  return {
    paintStylesCreated,
    textStylesCreated,
    variablesCreated
  };
}
