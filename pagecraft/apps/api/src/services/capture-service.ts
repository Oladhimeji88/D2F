import type {
  CrawlStartRequest,
  CreatePageCaptureInput,
  PluginCaptureRequest
} from "@pagecraft/shared-types";

import type { LocalStoreRepository } from "@pagecraft/capture-core";

import { badRequest } from "../lib/errors";
import { JobService } from "./job-service";

export class CaptureService {
  constructor(
    private readonly repository: LocalStoreRepository,
    private readonly jobs: JobService
  ) {}

  async submitUrlCapture(input: CreatePageCaptureInput) {
    const project = await this.repository.getProjectRecord(input.projectId);
    if (!project) {
      badRequest(`Project ${input.projectId} was not found.`);
    }

    const page = await this.repository.getOrCreatePage(input.projectId, input.url, input.title);
    const capture = await this.repository.createCaptureRecord({
      projectId: input.projectId,
      pageId: page.id,
      mode: input.mode,
      source: "url",
      status: "queued",
      screenshotUrl: null,
      serializedPage: null,
      normalized: null
    });

    const job = await this.repository.createJob({
      kind: input.mode === "style-guide" ? "style-guide" : "capture",
      status: "queued",
      projectId: input.projectId,
      pageId: page.id,
      crawlRunId: null,
      pageUrl: input.url,
      sourceUrl: input.url,
      progress: 0,
      message: "Capture queued.",
      errorMessage: null,
      payload: {
        pageId: page.id,
        captureId: capture.id,
        mode: input.mode,
        url: input.url
      }
    });

    await this.jobs.runInline(job.id);
    return this.repository.getJob(job.id);
  }

  async submitSerializedCapture(request: PluginCaptureRequest) {
    const project = await this.repository.getProjectRecord(request.projectId);
    if (!project) {
      badRequest(`Project ${request.projectId} was not found.`);
    }

    const page = await this.repository.getOrCreatePage(request.projectId, request.page.url, request.page.title);
    const capture = await this.repository.createCaptureRecord({
      projectId: request.projectId,
      pageId: page.id,
      mode: request.mode,
      source: "extension",
      status: "queued",
      screenshotUrl: null,
      serializedPage: request.page,
      normalized: null
    });

    const job = await this.repository.createJob({
      kind: request.mode === "style-guide" ? "style-guide" : "capture",
      status: "queued",
      projectId: request.projectId,
      pageId: page.id,
      crawlRunId: null,
      pageUrl: request.page.url,
      sourceUrl: request.tabUrl,
      progress: 0,
      message: "Extension capture queued.",
      errorMessage: null,
      payload: {
        pageId: page.id,
        captureId: capture.id,
        mode: request.mode,
        serializedPage: request.page
      }
    });

    await this.jobs.runInline(job.id);
    return this.repository.getJob(job.id);
  }

  async startCrawl(request: CrawlStartRequest) {
    const project = await this.repository.getProjectRecord(request.projectId);
    if (!project) {
      badRequest(`Project ${request.projectId} was not found.`);
    }

    const seedUrl = request.routes[0]?.url ?? request.tabUrl ?? request.siteOrigin;
    const crawlRun = await this.repository.createCrawlRun(request.projectId, seedUrl, request.settings.maxDepth, request.settings.maxPages);
    await this.repository.queueCrawlRoutes(crawlRun.id, request.routes);
    const job = await this.repository.createJob({
      kind: "crawl",
      status: "queued",
      projectId: request.projectId,
      pageId: null,
      crawlRunId: crawlRun.id,
      pageUrl: null,
      sourceUrl: request.tabUrl,
      progress: 0,
      message: "Crawl queued.",
      errorMessage: null,
      payload: {
        crawlRunId: crawlRun.id,
        settings: request.settings,
        routes: request.routes
      }
    });

    await this.jobs.runInline(job.id);
    return this.repository.getJob(job.id);
  }
}
