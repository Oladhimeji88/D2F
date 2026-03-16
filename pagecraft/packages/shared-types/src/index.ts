import { z } from "zod";

export const captureModeSchema = z.enum(["page", "style-guide"]);
export const projectStatusSchema = z.enum(["draft", "active", "archived"]);
export const pageStatusSchema = z.enum(["discovered", "queued", "captured", "failed", "archived"]);
export const jobStatusSchema = z.enum(["queued", "running", "completed", "failed", "cancelled"]);
export const crawlRunStatusSchema = z.enum(["queued", "running", "completed", "failed", "cancelled"]);
export const crawlRouteStatusSchema = z.enum(["discovered", "queued", "visited", "skipped", "failed"]);
export const jobKindSchema = z.enum(["capture", "style-guide", "crawl"]);

export const projectSummarySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slug: z.string().min(1),
  status: projectStatusSchema.default("active")
});

export const routeFilterSchema = z.object({
  include: z.array(z.string().min(1)).default([]),
  exclude: z.array(z.string().min(1)).default([])
});

export const crawlSettingsSchema = z.object({
  maxDepth: z.number().int().min(0).max(8).default(2),
  maxPages: z.number().int().min(1).max(500).default(25),
  filters: routeFilterSchema.default({ include: [], exclude: [] })
});

export const nodeRectSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().nonnegative(),
  height: z.number().nonnegative()
});

export const selectedStylesSchema = z.object({
  color: z.string().nullable().default(null),
  backgroundColor: z.string().nullable().default(null),
  fontFamily: z.string().nullable().default(null),
  fontSize: z.string().nullable().default(null),
  fontWeight: z.string().nullable().default(null),
  lineHeight: z.string().nullable().default(null),
  letterSpacing: z.string().nullable().default(null),
  display: z.string().nullable().default(null),
  position: z.string().nullable().default(null),
  borderRadius: z.string().nullable().default(null),
  boxShadow: z.string().nullable().default(null),
  gap: z.string().nullable().default(null),
  padding: z.string().nullable().default(null),
  margin: z.string().nullable().default(null),
  textTransform: z.string().nullable().default(null),
  textDecoration: z.string().nullable().default(null),
  opacity: z.string().nullable().default(null)
});

export type SelectedStyles = z.infer<typeof selectedStylesSchema>;

export const serializedNodeSchema: z.ZodType<SerializedNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.enum(["element", "text"]),
    tagName: z.string().min(1),
    role: z.string().nullable().default(null),
    text: z.string().nullable().default(null),
    rect: nodeRectSchema,
    styles: selectedStylesSchema,
    imageUrl: z.string().url().nullable().default(null),
    svgMarkup: z.string().nullable().default(null),
    linkUrl: z.string().url().nullable().default(null),
    idAttr: z.string().nullable().default(null),
    classList: z.array(z.string()).default([]),
    selector: z.string().nullable().default(null),
    warnings: z.array(z.string()).default([]),
    children: z.array(serializedNodeSchema).default([])
  })
);

export interface SerializedNode {
  id: string;
  type: "element" | "text";
  tagName: string;
  role: string | null;
  text: string | null;
  rect: z.infer<typeof nodeRectSchema>;
  styles: SelectedStyles;
  imageUrl: string | null;
  svgMarkup: string | null;
  linkUrl: string | null;
  idAttr: string | null;
  classList: string[];
  selector: string | null;
  warnings: string[];
  children: SerializedNode[];
}

export const discoveredRouteSchema = z.object({
  url: z.string().url(),
  pathname: z.string().min(1),
  depth: z.number().int().min(0),
  source: z.enum(["link", "canonical", "manual"]),
  skippedReason: z.string().nullable().default(null)
});

export const serializedPageSchema = z.object({
  url: z.string().url(),
  origin: z.string().url(),
  title: z.string().default(""),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  }),
  meta: z.object({
    description: z.string().nullable().default(null),
    canonicalUrl: z.string().url().nullable().default(null),
    lang: z.string().nullable().default(null)
  }),
  links: z.array(discoveredRouteSchema).default([]),
  nodes: z.array(serializedNodeSchema).default([]),
  images: z.array(z.string().url()).default([]),
  warnings: z.array(z.string()).default([]),
  truncated: z.boolean().default(false),
  estimatedBytes: z.number().int().nonnegative().default(0)
});

export const pluginCaptureRequestSchema = z.object({
  projectId: z.string().min(1),
  mode: captureModeSchema,
  tabUrl: z.string().url(),
  page: serializedPageSchema
});

export const crawlStartRequestSchema = z.object({
  projectId: z.string().min(1),
  siteOrigin: z.string().url(),
  tabUrl: z.string().url(),
  routes: z.array(discoveredRouteSchema),
  settings: crawlSettingsSchema
});

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional()
});

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema,
    error: apiErrorSchema.nullable().default(null)
  });

export const jobReferenceSchema = z.object({
  id: z.string().min(1),
  kind: jobKindSchema,
  status: jobStatusSchema,
  projectId: z.string().min(1),
  pageUrl: z.string().url().optional(),
  createdAt: z.string().min(1)
});

export const backendConfigSchema = z.object({
  apiBaseUrl: z.string().url().default("http://localhost:4000"),
  selectedProjectId: z.string().nullable().default(null),
  recentJobs: z.array(jobReferenceSchema).default([]),
  crawlSettings: crawlSettingsSchema.default({
    maxDepth: 2,
    maxPages: 25,
    filters: { include: [], exclude: [] }
  })
});

export const projectListItemSchema = projectSummarySchema.extend({
  pageCount: z.number().int().nonnegative().default(0),
  updatedAt: z.string().nullable().default(null)
});

export const pageListItemSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  siteId: z.string().nullable().default(null),
  url: z.string().url(),
  path: z.string().min(1),
  title: z.string().nullable().default(null),
  status: pageStatusSchema,
  updatedAt: z.string().nullable().default(null),
  screenshotUrl: z.string().nullable().default(null),
  lastCaptureAt: z.string().nullable().default(null)
});

export const warningLogSchema = z.object({
  id: z.string().min(1),
  severity: z.enum(["info", "warning", "error"]),
  code: z.string().min(1),
  message: z.string().min(1),
  context: z.record(z.string(), z.unknown()).nullable().default(null)
});

export const rgbaColorSchema = z.object({
  r: z.number().min(0).max(1),
  g: z.number().min(0).max(1),
  b: z.number().min(0).max(1),
  a: z.number().min(0).max(1).default(1)
});

export const normalizedPaintSchema = z.object({
  type: z.enum(["SOLID", "GRADIENT", "IMAGE"]).default("SOLID"),
  color: rgbaColorSchema.nullable().default(null),
  opacity: z.number().min(0).max(1).default(1),
  imageUrl: z.string().url().nullable().default(null),
  blendMode: z.string().nullable().default(null)
});

export const normalizedShadowSchema = z.object({
  x: z.number().default(0),
  y: z.number().default(0),
  blur: z.number().nonnegative().default(0),
  spread: z.number().default(0),
  color: rgbaColorSchema,
  inset: z.boolean().default(false)
});

export const normalizedPaddingSchema = z.object({
  top: z.number().default(0),
  right: z.number().default(0),
  bottom: z.number().default(0),
  left: z.number().default(0)
});

export const normalizedTypographySchema = z.object({
  fontFamily: z.string().nullable().default(null),
  fontStyle: z.string().nullable().default(null),
  fontWeight: z.number().nullable().default(null),
  fontSize: z.number().nullable().default(null),
  lineHeight: z.number().nullable().default(null),
  letterSpacing: z.number().nullable().default(null),
  textAlignHorizontal: z.string().nullable().default(null),
  textAlignVertical: z.string().nullable().default(null),
  textTransform: z.string().nullable().default(null),
  textDecoration: z.string().nullable().default(null)
});

export const normalizedLayoutSchema = z.object({
  mode: z.enum(["NONE", "HORIZONTAL", "VERTICAL"]).default("NONE"),
  wrap: z.enum(["NO_WRAP", "WRAP"]).default("NO_WRAP"),
  justifyContent: z.string().nullable().default(null),
  alignItems: z.string().nullable().default(null),
  alignSelf: z.string().nullable().default(null),
  positionType: z.enum(["AUTO", "ABSOLUTE"]).default("AUTO"),
  sizingHorizontal: z.string().nullable().default(null),
  sizingVertical: z.string().nullable().default(null)
});

export const normalizedAlignmentSchema = z.object({
  horizontal: z.string().nullable().default(null),
  vertical: z.string().nullable().default(null)
});

export const normalizedConstraintsSchema = z.object({
  horizontal: z.string().nullable().default(null),
  vertical: z.string().nullable().default(null)
});

export interface NormalizedNode {
  id: string;
  type: string;
  htmlTag: string | null;
  name: string | null;
  role: string | null;
  textContent: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  opacity: number;
  zIndex: number | null;
  fills: z.infer<typeof normalizedPaintSchema>[];
  strokes: z.infer<typeof normalizedPaintSchema>[];
  cornerRadius: number | null;
  shadows: z.infer<typeof normalizedShadowSchema>[];
  typography: z.infer<typeof normalizedTypographySchema> | null;
  layout: z.infer<typeof normalizedLayoutSchema> | null;
  padding: z.infer<typeof normalizedPaddingSchema> | null;
  gap: number | null;
  alignment: z.infer<typeof normalizedAlignmentSchema> | null;
  constraints: z.infer<typeof normalizedConstraintsSchema> | null;
  imageRef: string | null;
  svgRef: string | null;
  selector: string | null;
  sourcePath: string | null;
  children: NormalizedNode[];
  inferredFingerprint: string | null;
}

export const normalizedNodeSchema: z.ZodType<NormalizedNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    htmlTag: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    role: z.string().nullable().default(null),
    textContent: z.string().nullable().default(null),
    x: z.number().default(0),
    y: z.number().default(0),
    width: z.number().nonnegative().default(0),
    height: z.number().nonnegative().default(0),
    visible: z.boolean().default(true),
    opacity: z.number().min(0).max(1).default(1),
    zIndex: z.number().nullable().default(null),
    fills: z.array(normalizedPaintSchema).default([]),
    strokes: z.array(normalizedPaintSchema).default([]),
    cornerRadius: z.number().nullable().default(null),
    shadows: z.array(normalizedShadowSchema).default([]),
    typography: normalizedTypographySchema.nullable().default(null),
    layout: normalizedLayoutSchema.nullable().default(null),
    padding: normalizedPaddingSchema.nullable().default(null),
    gap: z.number().nullable().default(null),
    alignment: normalizedAlignmentSchema.nullable().default(null),
    constraints: normalizedConstraintsSchema.nullable().default(null),
    imageRef: z.string().nullable().default(null),
    svgRef: z.string().nullable().default(null),
    selector: z.string().nullable().default(null),
    sourcePath: z.string().nullable().default(null),
    children: z.array(normalizedNodeSchema).default([]),
    inferredFingerprint: z.string().nullable().default(null)
  })
);

export const normalizedCaptureSchema = z.object({
  id: z.string().min(1),
  pageId: z.string().min(1),
  url: z.string().url(),
  title: z.string().nullable().default(null),
  viewport: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive()
  }),
  nodes: z.array(normalizedNodeSchema).default([]),
  warnings: z.array(warningLogSchema).default([]),
  capturedAt: z.string().nullable().default(null)
});

export const exportAssetSchema = z.object({
  id: z.string().min(1),
  url: z.string().url(),
  mimeType: z.string().nullable().default(null),
  width: z.number().nullable().default(null),
  height: z.number().nullable().default(null),
  storageKey: z.string().nullable().default(null)
});

export const styleTokenKindSchema = z.enum(["color", "typography", "spacing", "radius", "shadow", "border", "effect"]);

export const styleTokenSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: styleTokenKindSchema,
  collection: z.string().default("core"),
  value: z.unknown(),
  description: z.string().nullable().default(null),
  fingerprint: z.string().nullable().default(null)
});

export const patternKindSchema = z.enum(["button", "card", "navigation", "footer", "input", "generic"]);

export const patternSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: patternKindSchema.default("generic"),
  status: z.string().default("validated"),
  fingerprint: z.string().min(1),
  confidence: z.number().min(0).max(1).default(0),
  description: z.string().nullable().default(null),
  sampleNodeIds: z.array(z.string()).default([]),
  sampleNodes: z.array(normalizedNodeSchema).default([])
});

export const styleTokenSummarySchema = z.object({
  total: z.number().int().nonnegative().default(0),
  colors: z.number().int().nonnegative().default(0),
  typography: z.number().int().nonnegative().default(0),
  spacing: z.number().int().nonnegative().default(0),
  radius: z.number().int().nonnegative().default(0),
  shadow: z.number().int().nonnegative().default(0)
});

export const patternSummarySchema = z.object({
  total: z.number().int().nonnegative().default(0),
  buttons: z.number().int().nonnegative().default(0),
  cards: z.number().int().nonnegative().default(0),
  navigation: z.number().int().nonnegative().default(0),
  inputs: z.number().int().nonnegative().default(0),
  generic: z.number().int().nonnegative().default(0)
});

export const projectActivitySchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["project", "capture", "crawl", "pattern", "warning"]),
  message: z.string().min(1),
  createdAt: z.string().min(1),
  status: z.string().nullable().default(null)
});

export const crawlRouteSchema = z.object({
  id: z.string().min(1),
  crawlRunId: z.string().min(1),
  url: z.string().url(),
  pathname: z.string().min(1),
  depth: z.number().int().min(0),
  status: crawlRouteStatusSchema,
  pageId: z.string().nullable().default(null),
  skipReason: z.string().nullable().default(null)
});

export const crawlRunSummarySchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  siteOrigin: z.string().url(),
  seedUrl: z.string().url(),
  status: crawlRunStatusSchema,
  maxDepth: z.number().int().min(0),
  maxPages: z.number().int().positive(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  discoveredCount: z.number().int().nonnegative().default(0),
  visitedCount: z.number().int().nonnegative().default(0),
  skippedCount: z.number().int().nonnegative().default(0),
  warningsCount: z.number().int().nonnegative().default(0)
});

export const templateClusterSchema = z.object({
  templateId: z.string().min(1),
  pageIds: z.array(z.string()).default([]),
  similarity: z.number().min(0).max(1).default(0),
  sharedFingerprints: z.array(z.string()).default([])
});

export const jobDetailSchema = jobReferenceSchema.extend({
  pageId: z.string().nullable().default(null),
  crawlRunId: z.string().nullable().default(null),
  progress: z.number().min(0).max(1).default(0),
  message: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  updatedAt: z.string().min(1)
});

export const normalizedNodeSummarySchema = z.object({
  total: z.number().int().nonnegative().default(0),
  textNodes: z.number().int().nonnegative().default(0),
  imageNodes: z.number().int().nonnegative().default(0),
  vectorNodes: z.number().int().nonnegative().default(0),
  maxDepth: z.number().int().nonnegative().default(0)
});

export const pageStyleSummarySchema = z.object({
  colors: z.array(z.string()).default([]),
  fontFamilies: z.array(z.string()).default([]),
  spacingValues: z.array(z.number()).default([]),
  radiusValues: z.array(z.number()).default([]),
  shadowCount: z.number().int().nonnegative().default(0)
});

export const projectDetailSchema = projectSummarySchema.extend({
  rootUrl: z.string().url().nullable().default(null),
  description: z.string().nullable().default(null),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  pagesCaptured: z.number().int().nonnegative().default(0),
  captureCount: z.number().int().nonnegative().default(0),
  jobCount: z.number().int().nonnegative().default(0),
  crawlRunCount: z.number().int().nonnegative().default(0),
  latestScreenshotUrl: z.string().nullable().default(null),
  styleSummary: styleTokenSummarySchema,
  patternSummary: patternSummarySchema,
  recentActivity: z.array(projectActivitySchema).default([]),
  pages: z.array(pageListItemSchema).default([]),
  crawlRuns: z.array(crawlRunSummarySchema).default([]),
  templateClusters: z.array(templateClusterSchema).default([]),
  jobs: z.array(jobDetailSchema).default([]),
  warnings: z.array(warningLogSchema).default([]),
  patterns: z.array(patternSchema).default([]),
  styles: z.array(styleTokenSchema).default([])
});

export const pageDetailSchema = pageListItemSchema.extend({
  projectName: z.string().min(1),
  metadata: z.object({
    canonicalUrl: z.string().nullable().default(null),
    description: z.string().nullable().default(null),
    lang: z.string().nullable().default(null)
  }),
  styleSummary: pageStyleSummarySchema,
  nodeSummary: normalizedNodeSummarySchema,
  warnings: z.array(warningLogSchema).default([]),
  capture: normalizedCaptureSchema.nullable().default(null),
  styles: z.array(styleTokenSchema).default([]),
  patterns: z.array(patternSchema).default([]),
  jobs: z.array(jobDetailSchema).default([])
});

export const devLoginInputSchema = z.object({
  email: z.string().email().default("demo@pagecraft.dev"),
  name: z.string().min(1).default("PageCraft Demo")
});

export const createProjectInputSchema = z.object({
  name: z.string().min(2).max(120),
  rootUrl: z.string().url().optional(),
  description: z.string().max(500).optional()
});

export const createPageCaptureInputSchema = z.object({
  projectId: z.string().min(1),
  url: z.string().url(),
  title: z.string().optional(),
  mode: captureModeSchema.default("page")
});

export const startCrawlInputSchema = z.object({
  projectId: z.string().min(1),
  rootUrl: z.string().url(),
  settings: crawlSettingsSchema
});

export const projectDetailsSchema = projectSummarySchema.extend({
  description: z.string().nullable().default(null)
});

export const projectExportBundleSchema = z.object({
  project: projectDetailsSchema,
  pages: z.array(pageListItemSchema).default([]),
  styles: z.array(styleTokenSchema).default([]),
  patterns: z.array(patternSchema).default([]),
  warnings: z.array(warningLogSchema).default([]),
  assets: z.array(exportAssetSchema).default([]),
  generatedAt: z.string().nullable().default(null)
});

export const pageExportBundleSchema = z.object({
  project: projectDetailsSchema,
  page: pageListItemSchema,
  capture: normalizedCaptureSchema,
  styles: z.array(styleTokenSchema).default([]),
  patterns: z.array(patternSchema).default([]),
  warnings: z.array(warningLogSchema).default([]),
  assets: z.array(exportAssetSchema).default([]),
  generatedAt: z.string().nullable().default(null)
});

export const pluginImportModeSchema = z.enum(["faithful", "editable", "style-guide-only"]);

export const pluginImportOptionsSchema = z.object({
  includeImages: z.boolean().default(true),
  createComponents: z.boolean().default(true),
  createVariables: z.boolean().default(false)
});

export const pluginSavedSettingsSchema = z.object({
  apiBaseUrl: z.string().url().default("http://localhost:4000"),
  selectedProjectId: z.string().nullable().default(null),
  selectedPageId: z.string().nullable().default(null),
  importMode: pluginImportModeSchema.default("editable"),
  options: pluginImportOptionsSchema.default({
    includeImages: true,
    createComponents: true,
    createVariables: false
  })
});

export type ProjectSummary = z.infer<typeof projectSummarySchema>;
export type CrawlSettings = z.infer<typeof crawlSettingsSchema>;
export type DiscoveredRoute = z.infer<typeof discoveredRouteSchema>;
export type SerializedPage = z.infer<typeof serializedPageSchema>;
export type PluginCaptureRequest = z.infer<typeof pluginCaptureRequestSchema>;
export type CrawlStartRequest = z.infer<typeof crawlStartRequestSchema>;
export type JobReference = z.infer<typeof jobReferenceSchema>;
export type BackendConfig = z.infer<typeof backendConfigSchema>;
export type ProjectListItem = z.infer<typeof projectListItemSchema>;
export type PageListItem = z.infer<typeof pageListItemSchema>;
export type WarningLog = z.infer<typeof warningLogSchema>;
export type RGBAColor = z.infer<typeof rgbaColorSchema>;
export type NormalizedPaint = z.infer<typeof normalizedPaintSchema>;
export type NormalizedShadow = z.infer<typeof normalizedShadowSchema>;
export type NormalizedPadding = z.infer<typeof normalizedPaddingSchema>;
export type NormalizedTypography = z.infer<typeof normalizedTypographySchema>;
export type NormalizedLayout = z.infer<typeof normalizedLayoutSchema>;
export type NormalizedAlignment = z.infer<typeof normalizedAlignmentSchema>;
export type NormalizedConstraints = z.infer<typeof normalizedConstraintsSchema>;
export type NormalizedCapture = z.infer<typeof normalizedCaptureSchema>;
export type ExportAsset = z.infer<typeof exportAssetSchema>;
export type StyleToken = z.infer<typeof styleTokenSchema>;
export type Pattern = z.infer<typeof patternSchema>;
export type ProjectDetails = z.infer<typeof projectDetailsSchema>;
export type ProjectExportBundle = z.infer<typeof projectExportBundleSchema>;
export type PageExportBundle = z.infer<typeof pageExportBundleSchema>;
export type PluginImportMode = z.infer<typeof pluginImportModeSchema>;
export type PluginImportOptions = z.infer<typeof pluginImportOptionsSchema>;
export type PluginSavedSettings = z.infer<typeof pluginSavedSettingsSchema>;
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type PageStatus = z.infer<typeof pageStatusSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
export type CrawlRunStatus = z.infer<typeof crawlRunStatusSchema>;
export type CrawlRouteStatus = z.infer<typeof crawlRouteStatusSchema>;
export type JobKind = z.infer<typeof jobKindSchema>;
export type StyleTokenSummary = z.infer<typeof styleTokenSummarySchema>;
export type PatternSummary = z.infer<typeof patternSummarySchema>;
export type ProjectActivity = z.infer<typeof projectActivitySchema>;
export type CrawlRoute = z.infer<typeof crawlRouteSchema>;
export type CrawlRunSummary = z.infer<typeof crawlRunSummarySchema>;
export type TemplateCluster = z.infer<typeof templateClusterSchema>;
export type JobDetail = z.infer<typeof jobDetailSchema>;
export type NormalizedNodeSummary = z.infer<typeof normalizedNodeSummarySchema>;
export type PageStyleSummary = z.infer<typeof pageStyleSummarySchema>;
export type ProjectDetail = z.infer<typeof projectDetailSchema>;
export type PageDetail = z.infer<typeof pageDetailSchema>;
export type DevLoginInput = z.infer<typeof devLoginInputSchema>;
export type CreateProjectInput = z.infer<typeof createProjectInputSchema>;
export type CreatePageCaptureInput = z.infer<typeof createPageCaptureInputSchema>;
export type StartCrawlInput = z.infer<typeof startCrawlInputSchema>;
