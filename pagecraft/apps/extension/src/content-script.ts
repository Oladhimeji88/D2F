import { crawlSettingsSchema, serializedPageSchema } from "@pagecraft/shared-types";

import { serializeVisiblePage } from "./lib/dom-serializer";
import { contentMessageTypes, type ContentRequest } from "./lib/messages";
import { discoverRoutesFromDocument } from "./lib/route-discovery";

chrome.runtime.onMessage.addListener((message: ContentRequest, _sender, sendResponse) => {
  try {
    if (message.type === contentMessageTypes.ping) {
      sendResponse({ ok: true, data: true });
      return false;
    }

    if (message.type === contentMessageTypes.serializePage) {
      const payload = serializedPageSchema.parse(serializeVisiblePage(document));
      sendResponse({ ok: true, data: payload });
      return false;
    }

    if (message.type === contentMessageTypes.discoverRoutes) {
      const settings = crawlSettingsSchema.parse(message.payload.settings);
      const discovery = discoverRoutesFromDocument(document, window.location.href, settings);
      sendResponse({ ok: true, data: discovery });
      return false;
    }

    sendResponse({ ok: false, error: "Unknown content-script message." });
    return false;
  } catch (error) {
    const messageText = error instanceof Error ? error.message : "Unexpected content-script error.";
    sendResponse({ ok: false, error: messageText });
    return false;
  }
});
