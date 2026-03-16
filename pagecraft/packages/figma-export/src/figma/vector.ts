export function createNodeFromSvgMarkup(svgMarkup: string, warnings: string[]): SceneNode | null {
  try {
    return figma.createNodeFromSvg(svgMarkup);
  } catch (error) {
    warnings.push(error instanceof Error ? error.message : "Inline SVG import failed.");
    return null;
  }
}
