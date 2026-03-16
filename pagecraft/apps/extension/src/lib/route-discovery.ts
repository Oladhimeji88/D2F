import type { CrawlSettings, DiscoveredRoute } from "@pagecraft/shared-types";

import { canonicalizeUrl, dedupeRoutes, routeDepth, shouldIncludeRoute } from "./url";

export interface RouteDiscoveryResult {
  siteOrigin: string;
  tabUrl: string;
  routes: DiscoveredRoute[];
  warnings: string[];
}

function addRouteCandidate(
  collection: DiscoveredRoute[],
  href: string | null,
  currentUrl: string,
  settings: CrawlSettings,
  source: DiscoveredRoute["source"]
) {
  if (!href) {
    return;
  }

  const canonical = canonicalizeUrl(href, currentUrl);
  if (!canonical) {
    return;
  }

  const currentOrigin = new URL(currentUrl).origin;
  if (!shouldIncludeRoute(canonical, currentOrigin, settings)) {
    return;
  }

  collection.push({
    url: canonical,
    pathname: new URL(canonical).pathname || "/",
    depth: routeDepth(currentUrl, canonical),
    source,
    skippedReason: null
  });
}

export function discoverRoutesFromDocument(document: Document, currentUrl: string, settings: CrawlSettings): RouteDiscoveryResult {
  const canonicalCurrentUrl = canonicalizeUrl(currentUrl) ?? currentUrl;
  const currentOrigin = new URL(canonicalCurrentUrl).origin;
  const warnings: string[] = [];
  const candidates: DiscoveredRoute[] = [];

  addRouteCandidate(candidates, canonicalCurrentUrl, canonicalCurrentUrl, settings, "manual");

  const canonicalLink = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  addRouteCandidate(candidates, canonicalLink?.href ?? null, canonicalCurrentUrl, settings, "canonical");

  const anchors = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"));
  for (const anchor of anchors) {
    addRouteCandidate(candidates, anchor.getAttribute("href"), canonicalCurrentUrl, settings, "link");
  }

  const routes = dedupeRoutes(candidates)
    .sort((left, right) => {
      if (left.depth !== right.depth) {
        return left.depth - right.depth;
      }

      return left.pathname.localeCompare(right.pathname);
    })
    .slice(0, settings.maxPages);

  if (anchors.length > settings.maxPages) {
    warnings.push(`Route discovery truncated to ${settings.maxPages} pages.`);
  }

  return {
    siteOrigin: currentOrigin,
    tabUrl: canonicalCurrentUrl,
    routes,
    warnings
  };
}
