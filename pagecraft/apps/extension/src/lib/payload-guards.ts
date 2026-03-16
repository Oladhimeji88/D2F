import type { SerializedNode, SerializedPage } from "@pagecraft/shared-types";

export const DEFAULT_MAX_NODES = 350;
export const DEFAULT_MAX_BYTES = 450_000;
export const DEFAULT_MAX_TEXT_LENGTH = 280;
export const DEFAULT_MAX_SVG_LENGTH = 8_000;

export function estimateSerializedBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).length;
}

export function truncateString(input: string, maxLength: number): string {
  if (input.length <= maxLength) {
    return input;
  }

  return `${input.slice(0, Math.max(0, maxLength - 1))}…`;
}

function dropDeepestNode(nodes: SerializedNode[]): boolean {
  const lastNode = nodes.at(-1);
  if (!lastNode) {
    return false;
  }

  if (lastNode.children.length > 0 && dropDeepestNode(lastNode.children)) {
    return true;
  }

  nodes.pop();
  return true;
}

export function enforcePayloadBudget(payload: SerializedPage, maxBytes = DEFAULT_MAX_BYTES): SerializedPage {
  const nextPayload: SerializedPage = {
    ...payload,
    links: [...payload.links],
    nodes: structuredClone(payload.nodes),
    images: [...payload.images],
    warnings: [...payload.warnings]
  };

  while (estimateSerializedBytes(nextPayload) > maxBytes) {
    if (dropDeepestNode(nextPayload.nodes)) {
      nextPayload.truncated = true;
      continue;
    }

    if (nextPayload.links.length > 0) {
      nextPayload.links.pop();
      nextPayload.truncated = true;
      continue;
    }

    if (nextPayload.images.length > 0) {
      nextPayload.images.pop();
      nextPayload.truncated = true;
      continue;
    }

    break;
  }

  if (nextPayload.truncated && !nextPayload.warnings.includes("Payload truncated to fit extension transport budget.")) {
    nextPayload.warnings.push("Payload truncated to fit extension transport budget.");
  }

  nextPayload.estimatedBytes = estimateSerializedBytes(nextPayload);
  return nextPayload;
}
