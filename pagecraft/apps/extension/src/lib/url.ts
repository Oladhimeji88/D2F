import type { CrawlSettings, DiscoveredRoute } from "@pagecraft/shared-types";

const DESTRUCTIVE_PATH_PATTERNS = [
  /\/logout/i,
  /\/signout/i,
  /\/delete/i,
  /\/remove/i,
  /\/destroy/i,
  /\/checkout/i,
  /\/payment/i,
  /\/billing/i,
  /\/unsubscribe/i,
  /\/cart\/clear/i
];

export function canonicalizeUrl(input: string, baseUrl?: string): string | null {
  try {
    const parsed = new URL(input, baseUrl);

    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";

    if ((parsed.protocol === "http:" && parsed.port === "80") || (parsed.protocol === "https:" && parsed.port === "443")) {
      parsed.port = "";
    }

    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/");

    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function splitPatternList(input: string): string[] {
  return input
    .split(/[\n,]/g)
    .map((pattern) => pattern.trim())
    .filter(Boolean);
}

export function matchesPathPattern(pathname: string, pattern: string): boolean {
  const escaped = pattern
    .trim()
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`, "i").test(pathname);
}

export function isProbablyDestructiveRoute(url: string): boolean {
  return DESTRUCTIVE_PATH_PATTERNS.some((pattern) => pattern.test(new URL(url).pathname));
}

export function shouldIncludeRoute(url: string, currentOrigin: string, settings: CrawlSettings): boolean {
  const parsed = new URL(url);

  if (parsed.origin !== currentOrigin || isProbablyDestructiveRoute(url)) {
    return false;
  }

  const pathname = parsed.pathname || "/";
  const includes = settings.filters.include;
  const excludes = settings.filters.exclude;

  if (includes.length > 0 && !includes.some((pattern) => matchesPathPattern(pathname, pattern))) {
    return false;
  }

  if (excludes.some((pattern) => matchesPathPattern(pathname, pattern))) {
    return false;
  }

  return true;
}

export function routeDepth(fromUrl: string, toUrl: string): number {
  const fromSegments = new URL(fromUrl).pathname.split("/").filter(Boolean);
  const toSegments = new URL(toUrl).pathname.split("/").filter(Boolean);
  let common = 0;

  while (common < fromSegments.length && common < toSegments.length && fromSegments[common] === toSegments[common]) {
    common += 1;
  }

  return Math.max(0, toSegments.length - common);
}

export function dedupeRoutes(routes: DiscoveredRoute[]): DiscoveredRoute[] {
  const seen = new Set<string>();
  return routes.filter((route) => {
    if (seen.has(route.url)) {
      return false;
    }

    seen.add(route.url);
    return true;
  });
}
