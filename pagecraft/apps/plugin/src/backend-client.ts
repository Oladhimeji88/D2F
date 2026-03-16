import {
  apiEnvelopeSchema,
  pageExportBundleSchema,
  pageListItemSchema,
  patternSchema,
  projectExportBundleSchema,
  projectListItemSchema,
  projectSummarySchema,
  styleTokenSchema,
  warningLogSchema,
  type PageExportBundle,
  type PageListItem,
  type Pattern,
  type ProjectExportBundle,
  type ProjectListItem,
  type StyleToken,
  type WarningLog
} from "@pagecraft/shared-types";
import { z } from "zod";

const projectListResponseSchema = z.array(
  z.union([
    projectListItemSchema,
    projectSummarySchema.transform((project) => ({
      ...project,
      pageCount: 0,
      updatedAt: null
    }))
  ])
);

async function parseApiResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof json === "object" && json !== null && "message" in json && typeof json.message === "string"
        ? json.message
        : `Backend request failed with status ${response.status}.`;
    throw new Error(message);
  }

  const envelope = apiEnvelopeSchema(schema).safeParse(json);
  if (envelope.success) {
    return envelope.data.data;
  }

  return schema.parse(json);
}

export class PageCraftPluginApiClient {
  constructor(private readonly apiBaseUrl: string) {}

  async listProjects(): Promise<ProjectListItem[]> {
    const response = await fetch(`${this.apiBaseUrl}/plugin/projects`);
    return parseApiResponse(response, projectListResponseSchema);
  }

  async listPages(projectId: string): Promise<PageListItem[]> {
    const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}/pages`);
    return parseApiResponse(response, z.array(pageListItemSchema));
  }

  async getProjectExport(projectId: string): Promise<ProjectExportBundle> {
    const response = await fetch(`${this.apiBaseUrl}/plugin/projects/${projectId}/export`);
    return parseApiResponse(response, projectExportBundleSchema);
  }

  async getPageExport(pageId: string): Promise<PageExportBundle> {
    const response = await fetch(`${this.apiBaseUrl}/plugin/pages/${pageId}/export`);
    return parseApiResponse(response, pageExportBundleSchema);
  }

  async getStyles(projectId: string): Promise<StyleToken[]> {
    const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}/styles`);
    return parseApiResponse(response, z.array(styleTokenSchema));
  }

  async getPatterns(projectId: string): Promise<Pattern[]> {
    const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}/patterns`);
    return parseApiResponse(response, z.array(patternSchema));
  }

  async getWarnings(projectId: string): Promise<WarningLog[]> {
    const response = await fetch(`${this.apiBaseUrl}/projects/${projectId}/warnings`);
    return parseApiResponse(response, z.array(warningLogSchema));
  }
}
