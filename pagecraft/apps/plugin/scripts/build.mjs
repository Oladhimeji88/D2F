import { build } from "esbuild";
import { watch } from "node:fs";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const cliWatch = process.argv.includes("--watch");
const appRoot = resolve(import.meta.dirname, "..");
const srcRoot = resolve(appRoot, "src");
const distRoot = resolve(appRoot, "dist");

async function buildUiBundle() {
  const [htmlTemplate, cssSource] = await Promise.all([
    readFile(resolve(srcRoot, "ui.html"), "utf8"),
    readFile(resolve(srcRoot, "ui.css"), "utf8")
  ]);

  const uiBuild = await build({
    bundle: true,
    entryPoints: [resolve(srcRoot, "ui.ts")],
    format: "iife",
    legalComments: "none",
    minify: false,
    platform: "browser",
    sourcemap: false,
    target: ["chrome120"],
    write: false
  });

  const uiScript = uiBuild.outputFiles[0]?.text ?? "";
  const htmlWithAssets = htmlTemplate
    .replace("/*__INLINE_CSS__*/", cssSource)
    .replace("/*__INLINE_JS__*/", uiScript);

  await mkdir(distRoot, { recursive: true });
  await writeFile(resolve(distRoot, "ui.html"), htmlWithAssets, "utf8");
  return htmlWithAssets;
}

async function buildCodeBundle(inlineUiHtml) {
  await build({
    bundle: true,
    define: {
      __UI_HTML__: JSON.stringify(inlineUiHtml)
    },
    entryPoints: [resolve(srcRoot, "code.ts")],
    format: "iife",
    legalComments: "none",
    minify: false,
    outfile: resolve(distRoot, "code.js"),
    platform: "browser",
    sourcemap: false,
    target: ["es2022"]
  });
}

async function copyManifest() {
  await cp(resolve(appRoot, "manifest.json"), resolve(distRoot, "manifest.json"), { force: true });
}

async function fullBuild() {
  const inlineUiHtml = await buildUiBundle();
  await buildCodeBundle(inlineUiHtml);
  await copyManifest();
}

if (cliWatch) {
  await fullBuild();
  let rebuilding = false;
  let queued = false;
  const triggerBuild = async () => {
    if (rebuilding) {
      queued = true;
      return;
    }

    rebuilding = true;
    try {
      await fullBuild();
    } finally {
      rebuilding = false;
      if (queued) {
        queued = false;
        void triggerBuild();
      }
    }
  };

  watch(srcRoot, { recursive: true }, () => {
    void triggerBuild();
  });
  watch(resolve(appRoot, "manifest.json"), () => {
    void triggerBuild();
  });
  console.log("PageCraft plugin is watching for changes.");
} else {
  await fullBuild();
}
