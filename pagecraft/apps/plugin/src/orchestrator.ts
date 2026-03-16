import { buildComponentsPage, buildStyleGuidePage, FigmaNodeFactory, mapExportBundleToPlan, syncLocalStyles, type ImportSummary } from "@pagecraft/figma-export";
import type { PageExportBundle, PluginSavedSettings, ProjectExportBundle } from "@pagecraft/shared-types";

interface OrchestratorOptions {
  settings: PluginSavedSettings;
  onProgress: (payload: { stage: "prepare" | "cover" | "styles" | "components" | "pages" | "complete"; message: string; progress: number }) => void;
}

function ensurePage(name: string): PageNode {
  const existing = figma.root.children.find((node): node is PageNode => node.type === "PAGE" && node.name === name);
  if (existing) {
    return existing;
  }

  const page = figma.createPage();
  page.name = name;
  return page;
}

async function createText(content: string, size = 16, bold = false): Promise<TextNode> {
  await figma.loadFontAsync({ family: "Inter", style: bold ? "Bold" : "Regular" });
  const text = figma.createText();
  text.fontName = { family: "Inter", style: bold ? "Bold" : "Regular" };
  text.fontSize = size;
  text.characters = content;
  return text;
}

async function buildCoverPage(targetPage: PageNode, summaryTitle: string, notes: string[], warnings: string[]): Promise<void> {
  const root = figma.createFrame();
  root.name = "Cover / Import Summary";
  root.layoutMode = "VERTICAL";
  root.primaryAxisSizingMode = "AUTO";
  root.counterAxisSizingMode = "AUTO";
  root.itemSpacing = 20;
  root.paddingTop = 48;
  root.paddingRight = 48;
  root.paddingBottom = 48;
  root.paddingLeft = 48;
  root.cornerRadius = 24;
  root.fills = [
    {
      type: "SOLID",
      color: { r: 0.978, g: 0.973, b: 0.957 }
    }
  ];
  root.resize(1280, 10);

  const title = await createText(summaryTitle, 32, true);
  root.appendChild(title);

  const subtitle = await createText(`Imported ${new Date().toLocaleString()}`, 14, false);
  subtitle.opacity = 0.68;
  root.appendChild(subtitle);

  const notesFrame = figma.createFrame();
  notesFrame.layoutMode = "VERTICAL";
  notesFrame.primaryAxisSizingMode = "AUTO";
  notesFrame.counterAxisSizingMode = "AUTO";
  notesFrame.itemSpacing = 8;
  notesFrame.fills = [];

  for (const note of notes) {
    const text = await createText(note, 15, false);
    notesFrame.appendChild(text);
  }

  root.appendChild(notesFrame);

  if (warnings.length > 0) {
    const warningsFrame = figma.createFrame();
    warningsFrame.layoutMode = "VERTICAL";
    warningsFrame.primaryAxisSizingMode = "AUTO";
    warningsFrame.counterAxisSizingMode = "AUTO";
    warningsFrame.itemSpacing = 8;
    warningsFrame.paddingTop = 20;
    warningsFrame.paddingRight = 20;
    warningsFrame.paddingBottom = 20;
    warningsFrame.paddingLeft = 20;
    warningsFrame.cornerRadius = 18;
    warningsFrame.fills = [{ type: "SOLID", color: { r: 1, g: 0.965, b: 0.965 } }];

    const warningHeading = await createText("Warnings", 18, true);
    warningsFrame.appendChild(warningHeading);

    for (const warning of warnings) {
      const warningText = await createText(warning, 13, false);
      warningText.fills = [{ type: "SOLID", color: { r: 0.69, g: 0.12, b: 0.16 } }];
      warningsFrame.appendChild(warningText);
    }

    root.appendChild(warningsFrame);
  }

  targetPage.appendChild(root);
  root.x = 0;
  root.y = 0;
}

export class PageCraftImportOrchestrator {
  constructor(private readonly options: OrchestratorOptions) {}

  async run(projectBundle: ProjectExportBundle, pageBundle: PageExportBundle | null): Promise<ImportSummary> {
    const warnings: string[] = [];
    const pagesCreated = ["Cover / Import Summary", "Style Guide"];

    this.options.onProgress({
      stage: "prepare",
      message: "Preparing import plan from backend export bundle.",
      progress: 0.12
    });

    const plan = mapExportBundleToPlan(projectBundle, pageBundle, {
      mode: this.options.settings.importMode,
      options: this.options.settings.options
    });

    const styleStats = await syncLocalStyles(
      [...plan.tokens.colors, ...plan.tokens.typography],
      this.options.settings.options,
      warnings
    );

    this.options.onProgress({
      stage: "cover",
      message: "Building cover and summary pages.",
      progress: 0.28
    });

    const coverPage = ensurePage("Cover / Import Summary");
    await buildCoverPage(
      coverPage,
      `${plan.projectBundle.project.name} Import`,
      plan.coverNotes,
      [...plan.warnings.map((warning) => warning.message), ...warnings]
    );

    this.options.onProgress({
      stage: "styles",
      message: "Generating style guide page.",
      progress: 0.52
    });

    const styleGuidePage = ensurePage("Style Guide");
    await buildStyleGuidePage(styleGuidePage, plan);

    let componentsCreated = 0;
    if (this.options.settings.options.createComponents) {
      this.options.onProgress({
        stage: "components",
        message: "Generating reusable components from detected patterns.",
        progress: 0.72
      });

      const componentsPage = ensurePage("Components");
      componentsCreated = await buildComponentsPage(
        componentsPage,
        plan,
        {
          mode: this.options.settings.importMode,
          options: this.options.settings.options
        },
        warnings
      );
      pagesCreated.push("Components");
    }

    let nodesCreated = 0;
    if (this.options.settings.importMode !== "style-guide-only" && pageBundle) {
      this.options.onProgress({
        stage: "pages",
        message: "Creating imported page frames and layers.",
        progress: 0.88
      });

      const importedPagesPage = ensurePage("Imported Pages");
      const pageRoot = figma.createFrame();
      pageRoot.name = pageBundle.page.title ?? pageBundle.page.path;
      pageRoot.resize(pageBundle.capture.viewport.width, pageBundle.capture.viewport.height);
      pageRoot.clipsContent = false;
      pageRoot.fills = [{ type: "SOLID", color: { r: 1, g: 1, b: 1 } }];

      const factory = new FigmaNodeFactory(
        {
          mode: this.options.settings.importMode,
          options: this.options.settings.options
        },
        [...projectBundle.assets, ...pageBundle.assets],
        warnings
      );

      nodesCreated = await factory.createNodes(plan.pageNodes, pageRoot);
      importedPagesPage.appendChild(pageRoot);
      pageRoot.x = 0;
      pageRoot.y = 0;
      pagesCreated.push("Imported Pages");
    }

    figma.currentPage = coverPage;
    figma.viewport.scrollAndZoomIntoView(coverPage.children);

    this.options.onProgress({
      stage: "complete",
      message: "Import complete.",
      progress: 1
    });

    return {
      mode: this.options.settings.importMode,
      pagesCreated,
      nodesCreated,
      componentsCreated,
      paintStylesCreated: styleStats.paintStylesCreated,
      textStylesCreated: styleStats.textStylesCreated,
      variablesCreated: styleStats.variablesCreated,
      warnings: [...new Set([...plan.warnings.map((warning) => warning.message), ...warnings])]
    };
  }
}
