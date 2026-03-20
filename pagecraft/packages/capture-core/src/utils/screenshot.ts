/**
 * Takes a real browser screenshot of a URL using Playwright.
 * Returns a base64 PNG data URL, or null if Playwright is unavailable or the capture fails.
 * The placeholder thumbnail in jobs.ts is used as the fallback when null is returned.
 */
export async function takeScreenshot(url: string): Promise<string | null> {
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setViewportSize({ width: 1440, height: 1024 });
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      const buffer = await page.screenshot({ type: "png" });
      return `data:image/png;base64,${buffer.toString("base64")}`;
    } finally {
      await browser.close();
    }
  } catch {
    return null;
  }
}
