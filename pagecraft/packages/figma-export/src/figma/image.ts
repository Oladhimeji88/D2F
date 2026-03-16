export async function fetchImageBytes(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Image request failed for ${url} with status ${response.status}.`);
  }

  return new Uint8Array(await response.arrayBuffer());
}

export async function applyImageFill(
  node: RectangleNode | FrameNode,
  imageUrl: string,
  warnings: string[]
): Promise<void> {
  try {
    const imageBytes = await fetchImageBytes(imageUrl);
    const image = figma.createImage(imageBytes);
    node.fills = [
      {
        type: "IMAGE",
        imageHash: image.hash,
        scaleMode: "FILL"
      }
    ];
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : `Failed to load image ${imageUrl}.`);
  }
}
