import { load } from "cheerio";

import type { CrawlSettings, DiscoveredRoute, SerializedPage } from "@pagecraft/shared-types";

import { canonicalizeUrl, dedupeRoutes, routeDepth, shouldIncludeRoute } from "../utils/url";

function discoverRoutesFromHtml(html: string, currentUrl: string, settings: CrawlSettings): DiscoveredRoute[] {
  const $ = load(html);
  const origin = new URL(currentUrl).origin;
  const candidates: DiscoveredRoute[] = [
    {
      url: currentUrl,
      pathname: new URL(currentUrl).pathname || "/",
      depth: 0,
      source: "manual",
      skippedReason: null
    }
  ];

  $("link[rel='canonical']").each((_, element) => {
    const href = $(element).attr("href");
    const canonical = canonicalizeUrl(href ?? "", currentUrl);
    if (canonical && shouldIncludeRoute(canonical, origin, settings)) {
      candidates.push({
        url: canonical,
        pathname: new URL(canonical).pathname || "/",
        depth: routeDepth(currentUrl, canonical),
        source: "canonical",
        skippedReason: null
      });
    }
  });

  $("a[href]").each((_, element) => {
    const href = $(element).attr("href");
    const canonical = canonicalizeUrl(href ?? "", currentUrl);
    if (canonical && shouldIncludeRoute(canonical, origin, settings)) {
      candidates.push({
        url: canonical,
        pathname: new URL(canonical).pathname || "/",
        depth: routeDepth(currentUrl, canonical),
        source: "link",
        skippedReason: null
      });
    }
  });

  return dedupeRoutes(candidates).slice(0, settings.maxPages);
}

export async function capturePublicUrl(url: string, settings: CrawlSettings): Promise<SerializedPage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch ${url}. HTTP ${response.status}.`);
  }

  const html = await response.text();
  const $ = load(html);
  const currentUrl = canonicalizeUrl(response.url || url) ?? url;
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 2200);
  const title = $("title").text().trim();

  return {
    url: currentUrl,
    origin: new URL(currentUrl).origin,
    title,
    viewport: {
      width: 1440,
      height: 1024
    },
    meta: {
      description: $("meta[name='description']").attr("content") ?? null,
      canonicalUrl: canonicalizeUrl($("link[rel='canonical']").attr("href") ?? "", currentUrl),
      lang: $("html").attr("lang") ?? null
    },
    links: discoverRoutesFromHtml(html, currentUrl, settings),
    nodes: [
      {
        id: "root/body[1]",
        type: "element",
        tagName: "body",
        role: null,
        text: bodyText.slice(0, 280),
        rect: {
          x: 0,
          y: 0,
          width: 1440,
          height: 1024
        },
        styles: {
          color: null,
          backgroundColor: null,
          fontFamily: "Inter",
          fontSize: "16px",
          fontWeight: "400",
          lineHeight: "24px",
          letterSpacing: "0px",
          display: "block",
          position: "static",
          borderRadius: null,
          boxShadow: null,
          gap: null,
          padding: null,
          margin: null,
          textTransform: null,
          textDecoration: null,
          opacity: "1"
        },
        imageUrl: null,
        svgMarkup: null,
        linkUrl: null,
        idAttr: null,
        classList: [],
        selector: "body",
        warnings: [],
        children: []
      }
    ],
    images: $("img[src]")
      .map((_, element) => canonicalizeUrl($(element).attr("src") ?? "", currentUrl))
      .get()
      .filter((image): image is string => Boolean(image))
      .slice(0, 12),
    warnings: [],
    truncated: false,
    estimatedBytes: new TextEncoder().encode(html.slice(0, 2400)).length
  };
}
