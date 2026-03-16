import type { RGBAColor } from "@pagecraft/shared-types";

function clampChannel(value: number): number {
  return Math.min(255, Math.max(0, value));
}

export function hexToRgba(input: string): RGBAColor | null {
  const normalized = input.trim().replace(/^#/, "");
  if (![3, 4, 6, 8].includes(normalized.length)) {
    return null;
  }

  const expanded = normalized.length <= 4 ? normalized.split("").map((value) => `${value}${value}`).join("") : normalized;
  const alphaHex = expanded.length === 8 ? expanded.slice(6, 8) : "ff";
  const r = Number.parseInt(expanded.slice(0, 2), 16);
  const g = Number.parseInt(expanded.slice(2, 4), 16);
  const b = Number.parseInt(expanded.slice(4, 6), 16);
  const a = Number.parseInt(alphaHex, 16) / 255;

  if ([r, g, b].some((channel) => Number.isNaN(channel)) || Number.isNaN(a)) {
    return null;
  }

  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a
  };
}

export function rgbStringToRgba(input: string): RGBAColor | null {
  const match = input
    .trim()
    .match(/^rgba?\(\s*([0-9.]+)\s*[, ]\s*([0-9.]+)\s*[, ]\s*([0-9.]+)(?:\s*[,/]\s*([0-9.]+))?\s*\)$/i);

  if (!match) {
    return null;
  }

  const [, rText, gText, bText, aText] = match;
  const r = clampChannel(Number(rText));
  const g = clampChannel(Number(gText));
  const b = clampChannel(Number(bText));
  const a = aText === undefined ? 1 : Math.min(1, Math.max(0, Number(aText)));

  if ([r, g, b, a].some((channel) => Number.isNaN(channel))) {
    return null;
  }

  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a
  };
}

export function parseColorString(input: string | null | undefined): RGBAColor | null {
  if (!input) {
    return null;
  }

  if (input.trim().startsWith("#")) {
    return hexToRgba(input);
  }

  return rgbStringToRgba(input);
}

export function rgbaToHex(color: RGBAColor): string {
  const toHex = (value: number) => Math.round(value * 255).toString(16).padStart(2, "0");
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`.toUpperCase();
}

export function rgbaToPaint(color: RGBAColor): SolidPaint {
  return {
    type: "SOLID",
    color: {
      r: color.r,
      g: color.g,
      b: color.b
    },
    opacity: color.a
  };
}
