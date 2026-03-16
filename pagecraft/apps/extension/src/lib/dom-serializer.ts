import { serializedPageSchema, type SelectedStyles, type SerializedNode, type SerializedPage } from "@pagecraft/shared-types";

import {
  DEFAULT_MAX_BYTES,
  DEFAULT_MAX_NODES,
  DEFAULT_MAX_SVG_LENGTH,
  DEFAULT_MAX_TEXT_LENGTH,
  enforcePayloadBudget,
  estimateSerializedBytes,
  truncateString
} from "./payload-guards";
import { discoverRoutesFromDocument } from "./route-discovery";
import { canonicalizeUrl } from "./url";

const IGNORED_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);

interface SerializerOptions {
  maxNodes?: number;
  maxBytes?: number;
  maxTextLength?: number;
  maxSvgLength?: number;
}

interface SerializerState {
  images: Set<string>;
  nodeCount: number;
  truncated: boolean;
  warnings: string[];
  options: Required<SerializerOptions>;
}

function inferRole(element: Element): string | null {
  const explicitRole = element.getAttribute("role");
  if (explicitRole) {
    return explicitRole;
  }

  const tagName = element.tagName.toLowerCase();
  if (tagName === "a") {
    return "link";
  }

  if (tagName === "button") {
    return "button";
  }

  if (/^h[1-6]$/.test(tagName)) {
    return "heading";
  }

  return null;
}

function isVisible(element: Element, rect: DOMRect, styles: CSSStyleDeclaration): boolean {
  if (element.hasAttribute("hidden") || element.getAttribute("aria-hidden") === "true") {
    return false;
  }

  if (styles.display === "none" || styles.visibility === "hidden" || styles.opacity === "0") {
    return false;
  }

  if (rect.width === 0 && rect.height === 0 && !element.textContent?.trim()) {
    return false;
  }

  return true;
}

function safeString(value: string | null | undefined): string | null {
  return value && value.trim().length > 0 ? value.trim() : null;
}

function sanitizeClassList(element: Element): string[] {
  return Array.from(element.classList)
    .filter((className) => /^[a-z0-9_-]{1,40}$/i.test(className))
    .slice(0, 4);
}

function buildSelector(element: Element): string | null {
  const tagName = element.tagName.toLowerCase();
  const id = element.id && /^[a-z][\w:-]{0,60}$/i.test(element.id) ? `#${element.id}` : "";
  const classes = sanitizeClassList(element)
    .slice(0, 2)
    .map((className) => `.${className}`)
    .join("");
  const selector = `${tagName}${id}${classes}`;

  return selector.length > 0 ? selector : null;
}

function selectedStyles(styles: CSSStyleDeclaration): SelectedStyles {
  return {
    color: safeString(styles.color),
    backgroundColor: safeString(styles.backgroundColor),
    fontFamily: safeString(styles.fontFamily),
    fontSize: safeString(styles.fontSize),
    fontWeight: safeString(styles.fontWeight),
    lineHeight: safeString(styles.lineHeight),
    letterSpacing: safeString(styles.letterSpacing),
    display: safeString(styles.display),
    position: safeString(styles.position),
    borderRadius: safeString(styles.borderRadius),
    boxShadow: safeString(styles.boxShadow),
    gap: safeString(styles.gap),
    padding: safeString(styles.padding),
    margin: safeString(styles.margin),
    textTransform: safeString(styles.textTransform),
    textDecoration: safeString(styles.textDecorationLine),
    opacity: safeString(styles.opacity)
  };
}

function ownTextContent(element: Element, maxTextLength: number): string | null {
  const text = Array.from(element.childNodes)
    .filter((child) => child.nodeType === Node.TEXT_NODE)
    .map((child) => child.textContent?.replace(/\s+/g, " ").trim() ?? "")
    .filter(Boolean)
    .join(" ")
    .trim();

  return text ? truncateString(text, maxTextLength) : null;
}

function backgroundImageUrl(styles: CSSStyleDeclaration): string | null {
  const match = styles.backgroundImage.match(/url\(["']?(.*?)["']?\)/i);
  return match?.[1] ?? null;
}

function rectToSerializable(rect: DOMRect) {
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

function createTextNode(parentId: string, index: number, text: string, rect: DOMRect, styles: SelectedStyles): SerializedNode {
  return {
    id: `${parentId}:text:${index}`,
    type: "text",
    tagName: "#text",
    role: null,
    text,
    rect: rectToSerializable(rect),
    styles,
    imageUrl: null,
    svgMarkup: null,
    linkUrl: null,
    idAttr: null,
    classList: [],
    selector: null,
    warnings: [],
    children: []
  };
}

function serializeElement(element: Element, state: SerializerState, path: string): SerializedNode | null {
  if (IGNORED_TAGS.has(element.tagName)) {
    return null;
  }

  if (state.nodeCount >= state.options.maxNodes) {
    state.truncated = true;
    state.warnings.push(`Serializer stopped at ${state.options.maxNodes} nodes.`);
    return null;
  }

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  if (!isVisible(element, rect, styles)) {
    return null;
  }

  state.nodeCount += 1;

  const nodeStyles = selectedStyles(styles);
  const tagName = element.tagName.toLowerCase();
  const warnings: string[] = [];
  const text = ownTextContent(element, state.options.maxTextLength);

  let imageUrl: string | null = null;
  if (element instanceof HTMLImageElement) {
    imageUrl = canonicalizeUrl(element.currentSrc || element.src, window.location.href);
  } else {
    const backgroundUrl = backgroundImageUrl(styles);
    imageUrl = backgroundUrl ? canonicalizeUrl(backgroundUrl, window.location.href) : null;
  }

  if (imageUrl) {
    state.images.add(imageUrl);
  }

  let svgMarkup: string | null = null;
  if (tagName === "svg") {
    svgMarkup = truncateString(element.outerHTML, state.options.maxSvgLength);
    if (element.outerHTML.length > state.options.maxSvgLength) {
      warnings.push("Inline SVG markup was truncated.");
      state.truncated = true;
    }
  }

  const linkUrl = tagName === "a" ? canonicalizeUrl((element as HTMLAnchorElement).href, window.location.href) : null;
  const id = `${path}/${tagName}[${state.nodeCount}]`;

  const children: SerializedNode[] = [];
  let textIndex = 0;

  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const childText = child.textContent?.replace(/\s+/g, " ").trim();
      if (childText) {
        children.push(createTextNode(id, textIndex, truncateString(childText, state.options.maxTextLength), rect, nodeStyles));
        textIndex += 1;
      }
      continue;
    }

    if (child.nodeType === Node.ELEMENT_NODE) {
      const serializedChild = serializeElement(child as Element, state, id);
      if (serializedChild) {
        children.push(serializedChild);
      }
    }
  }

  return {
    id,
    type: "element",
    tagName,
    role: inferRole(element),
    text,
    rect: rectToSerializable(rect),
    styles: nodeStyles,
    imageUrl,
    svgMarkup,
    linkUrl,
    idAttr: safeString(element.id),
    classList: sanitizeClassList(element),
    selector: buildSelector(element),
    warnings,
    children
  };
}

export function serializeVisiblePage(document: Document, options: SerializerOptions = {}): SerializedPage {
  const mergedOptions: Required<SerializerOptions> = {
    maxBytes: options.maxBytes ?? DEFAULT_MAX_BYTES,
    maxNodes: options.maxNodes ?? DEFAULT_MAX_NODES,
    maxSvgLength: options.maxSvgLength ?? DEFAULT_MAX_SVG_LENGTH,
    maxTextLength: options.maxTextLength ?? DEFAULT_MAX_TEXT_LENGTH
  };

  const state: SerializerState = {
    images: new Set<string>(),
    nodeCount: 0,
    truncated: false,
    warnings: [],
    options: mergedOptions
  };

  const roots = Array.from((document.body ?? document.documentElement).children);
  const nodes = roots
    .map((element, index) => serializeElement(element, state, `root:${index}`))
    .filter((node): node is SerializedNode => node !== null);

  const currentUrl = canonicalizeUrl(window.location.href) ?? window.location.href;
  const discoveredLinks = discoverRoutesFromDocument(document, currentUrl, {
    maxDepth: 1,
    maxPages: 120,
    filters: {
      include: [],
      exclude: []
    }
  });
  const canonicalUrl =
    canonicalizeUrl(document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href ?? "", currentUrl) ?? null;

  const payload = serializedPageSchema.parse({
    url: currentUrl,
    origin: window.location.origin,
    title: document.title ?? "",
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    meta: {
      description: document.querySelector<HTMLMetaElement>('meta[name="description"]')?.content ?? null,
      canonicalUrl,
      lang: document.documentElement.lang || null
    },
    links: discoveredLinks.routes,
    nodes,
    images: Array.from(state.images),
    warnings: [...state.warnings, ...discoveredLinks.warnings],
    truncated: state.truncated,
    estimatedBytes: 0
  });

  payload.estimatedBytes = estimateSerializedBytes(payload);
  return enforcePayloadBudget(payload, mergedOptions.maxBytes);
}
