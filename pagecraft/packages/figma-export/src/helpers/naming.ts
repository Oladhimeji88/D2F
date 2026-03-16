import type { Pattern, StyleToken } from "@pagecraft/shared-types";

export function slugifyName(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function titleCase(input: string): string {
  return input
    .split(/[\s/_-]+/g)
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function stableFallbackName(prefix: string, source: string, index = 0): string {
  const slug = slugifyName(source || `${prefix}-${index}`);
  return `${prefix}/${slug || `${prefix}-${index + 1}`}`;
}

export function tokenStyleName(token: StyleToken, index = 0): string {
  const normalizedName = token.name.includes("/") ? token.name : token.name.replace(/\./g, "/");
  return normalizedName.trim().length > 0 ? normalizedName : stableFallbackName(token.kind, token.fingerprint ?? token.id, index);
}

export function componentNameFromPattern(pattern: Pattern, index = 0): string {
  const baseName = pattern.name.trim() || stableFallbackName("component", pattern.fingerprint, index);
  return titleCase(baseName.replace(/\./g, " "));
}
