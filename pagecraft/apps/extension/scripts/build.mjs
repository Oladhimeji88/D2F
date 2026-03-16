import { build, context } from "esbuild";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const watch = process.argv.includes("--watch");
const appRoot = resolve(import.meta.dirname, "..");
const srcRoot = resolve(appRoot, "src");
const distRoot = resolve(appRoot, "dist");

const entryPoints = [
  ["background.ts", "background.js"],
  ["content-script.ts", "content-script.js"],
  ["popup.ts", "popup.js"],
  ["side-panel.ts", "side-panel.js"]
];

const staticFiles = [
  [resolve(appRoot, "manifest.json"), resolve(distRoot, "manifest.json")],
  [resolve(srcRoot, "popup.html"), resolve(distRoot, "popup.html")],
  [resolve(srcRoot, "popup.css"), resolve(distRoot, "popup.css")],
  [resolve(srcRoot, "side-panel.html"), resolve(distRoot, "side-panel.html")],
  [resolve(srcRoot, "side-panel.css"), resolve(distRoot, "side-panel.css")]
];

const baseConfig = {
  bundle: true,
  format: "iife",
  legalComments: "none",
  minify: false,
  platform: "browser",
  sourcemap: true,
  target: ["chrome120"]
};

async function copyStaticFiles() {
  await mkdir(distRoot, { recursive: true });

  await Promise.all(
    staticFiles.map(async ([source, destination]) => {
      await cp(source, destination, { force: true });
    })
  );
}

async function createContexts() {
  return Promise.all(
    entryPoints.map(async ([entryPoint, outfile]) =>
      context({
        ...baseConfig,
        entryPoints: [resolve(srcRoot, entryPoint)],
        outfile: resolve(distRoot, outfile)
      })
    )
  );
}

if (watch) {
  const contexts = await createContexts();
  await copyStaticFiles();
  await Promise.all(contexts.map(async (currentContext) => currentContext.watch()));
  console.log("PageCraft extension is watching for changes.");
} else {
  await mkdir(distRoot, { recursive: true });
  await Promise.all(
    entryPoints.map(async ([entryPoint, outfile]) =>
      build({
        ...baseConfig,
        entryPoints: [resolve(srcRoot, entryPoint)],
        outfile: resolve(distRoot, outfile)
      })
    )
  );
  await copyStaticFiles();
}
