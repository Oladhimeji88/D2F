import type { NormalizedTypography } from "@pagecraft/shared-types";

const FALLBACK_FONTS: FontName[] = [
  { family: "Inter", style: "Regular" },
  { family: "Roboto", style: "Regular" }
];

function styleFromWeight(weight: number | null | undefined): string {
  if (!weight) {
    return "Regular";
  }

  if (weight >= 700) {
    return "Bold";
  }

  if (weight >= 600) {
    return "Semi Bold";
  }

  if (weight <= 300) {
    return "Light";
  }

  return "Regular";
}

export async function loadFontWithFallback(
  typography: NormalizedTypography | null,
  warnings: string[]
): Promise<FontName> {
  const candidates: FontName[] = [];

  if (typography?.fontFamily) {
    candidates.push({
      family: typography.fontFamily,
      style: typography.fontStyle ?? styleFromWeight(typography.fontWeight)
    });
  }

  candidates.push(...FALLBACK_FONTS);

  for (const font of candidates) {
    try {
      await figma.loadFontAsync(font);
      return font;
    } catch {
      warnings.push(`Could not load font ${font.family} ${font.style}.`);
    }
  }

  const emergencyFallback: FontName = { family: "Roboto", style: "Regular" };
  await figma.loadFontAsync(emergencyFallback);
  return emergencyFallback;
}
