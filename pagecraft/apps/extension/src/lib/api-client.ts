import {
  apiEnvelopeSchema,
  crawlStartRequestSchema,
  jobReferenceSchema,
  pluginCaptureRequestSchema,
  projectSummarySchema,
  type CrawlStartRequest,
  type JobReference,
  type PluginCaptureRequest,
  type ProjectSummary
} from "@pagecraft/shared-types";
import { z } from "zod";

async function parseApiResponse<T>(response: Response, schema: z.ZodType<T>): Promise<T> {
  const json = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      typeof json === "object" && json !== null && "message" in json && typeof json.message === "string"
        ? json.message
        : `Request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const envelopeResult = apiEnvelopeSchema(schema).safeParse(json);
  if (envelopeResult.success) {
    return envelopeResult.data.data;
  }

  return schema.parse(json);
}

export class PageCraftApiClient {
  constructor(private readonly apiBaseUrl: string) {}

  async listProjects(): Promise<ProjectSummary[]> {
    const response = await fetch(`${this.apiBaseUrl}/plugin/projects`);
    return parseApiResponse(response, z.array(projectSummarySchema));
  }

  async createProject(name: string): Promise<ProjectSummary> {
    const response = await fetch(`${this.apiBaseUrl}/projects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name })
    });

    return parseApiResponse(response, projectSummarySchema);
  }

  async submitCurrentTabCapture(request: PluginCaptureRequest): Promise<JobReference> {
    const payload = pluginCaptureRequestSchema.parse(request);
    const response = await fetch(`${this.apiBaseUrl}/plugin/captures/current-tab`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return parseApiResponse(response, jobReferenceSchema);
  }

  async startCrawl(request: CrawlStartRequest): Promise<JobReference> {
    const payload = crawlStartRequestSchema.parse(request);
    const response = await fetch(`${this.apiBaseUrl}/plugin/crawls`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    return parseApiResponse(response, jobReferenceSchema);
  }

  async getJob(jobId: string): Promise<JobReference> {
    const response = await fetch(`${this.apiBaseUrl}/jobs/${jobId}`);
    return parseApiResponse(response, jobReferenceSchema);
  }
}
