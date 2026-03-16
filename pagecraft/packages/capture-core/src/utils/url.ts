import type { CrawlSettings, DiscoveredRoute } from "@pagecraft/shared-types";

const DANGEROUS_PATH_PATTERNS = [
  /\/logout/i,
  /\/signout/i,
  /\/delete/i,
  /\/remove/i,
  /\/destroy/i,
  /\/checkout/i,
  /\/payment/i,
  /\/billing\/portal/i,
  /\/unsubscribe/i
];

export function canonicalizeUrl(input: string, baseUrl?: string): string | null {
  try {
    const parsed = new URL(input, baseUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    parsed.hash = "";
    parsed.pathname = parsed.pathname.replace(/\/{2,}/g, "/");

    if ((parsed.protocol === "http:" && parsed.port === "80") || (parsed.protocol === "https:" && parsed.port === "443")) {
      parsed.port = "";
    }

    if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
      parsed.pathname = parsed.pathname.slice(0, -1);
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function matchesWildcard(pathname: string, pattern: string): boolean {
  const escaped = pattern
    .trim()
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");

  return new RegExp(`^${escaped}$`, "i").test(pathname);
}

export function isDangerousRoute(url: string): boolean {
  return DANGEROUS_PATH_PATTERNS.some((pattern) => pattern.test(new URL(url).pathname));
}

export function routeDepth(fromUrl: string, toUrl: string): number {
  const fromSegments = new URL(fromUrl).pathname.split("/").filter(Boolean);
  const toSegments = new URL(toUrl).pathname.split("/").filter(Boolean);
  return Math.max(0, toSegments.length - Math.min(fromSegments.length, toSegments.length));
}

export function shouldIncludeRoute(url: string, origin: string, settings: CrawlSettings): boolean {
  const parsed = new URL(url);
  if (parsed.origin !== origin || isDangerousRoute(url)) {
    return false;
  }

  const pathname = parsed.pathname || "/";
  if (settings.filters.include.length > 0 && !settings.filters.include.some((pattern) => matchesWildcard(pathname, pattern))) {
    return false;
  }

  if (settings.filters.exclude.some((pattern) => matchesWildcard(pathname, pattern))) {
    return false;
  }

  return true;
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
