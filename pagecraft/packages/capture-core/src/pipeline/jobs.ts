import { clusterPagesByTemplate, detectPatternsAcrossCaptures } from "@pagecraft/pattern-engine";
import type { CrawlSettings, DiscoveredRoute, SerializedPage } from "@pagecraft/shared-types";

import { buildPlaceholderThumbnail } from "../utils/thumbnail";
import { shouldIncludeRoute } from "../utils/url";
import { capturePublicUrl } from "./html-capture";
import { normalizeSerializedPage } from "./normalize";
import { extractStyleTokens } from "./style-tokens";
import { LocalStoreRepository } from "../store/repository";

function routeSettings(payload: Record<string, unknown>): CrawlSettings {
  const settings = payload.settings as CrawlSettings | undefined;
  return (
    settings ?? {
      maxDepth: 2,
      maxPages: 25,
      filters: {
        include: [],
        exclude: []
      }
    }
  );
}

async function refreshPatterns(repository: LocalStoreRepository, projectId: string) {
  const captures = await repository.listCapturesByProject(projectId);
  const normalizedCaptures = captures.map((capture) => capture.normalized).filter((capture): capture is NonNullable<typeof capture> => Boolean(capture));
  const patterns = detectPatternsAcrossCaptures(projectId, normalizedCaptures).map((pattern) => ({
    ...pattern,
    projectId
  }));

  await repository.replaceProjectPatterns(projectId, patterns);
  return clusterPagesByTemplate(normalizedCaptures);
}

async function finalizeCapture(
  repository: LocalStoreRepository,
  jobId: string,
  payload: {
    projectId: string;
    pageId: string;
    captureId: string;
    mode: "page" | "style-guide";
    serializedPage: SerializedPage;
  },
  options: {
    completeJob: boolean;
  } = { completeJob: true }
) {
  const normalized = normalizeSerializedPage(payload.pageId, payload.serializedPage, payload.captureId);
  const styles = extractStyleTokens(payload.projectId, normalized).map((token) => ({
    ...token,
    projectId: payload.projectId,
    pageId: payload.pageId
  }));

  await repository.completeCaptureResult(payload.captureId, {
    normalized,
    screenshotUrl: buildPlaceholderThumbnail(payload.serializedPage.title || new URL(payload.serializedPage.url).hostname),
    styles,
    warnings: normalized.warnings.map((warning) => ({
      ...warning,
      projectId: payload.projectId,
      pageId: payload.pageId,
      jobId
    })),
    pageTitle: payload.serializedPage.title || null,
    pageMetadata: payload.serializedPage.meta
  });

  const clusters = await refreshPatterns(repository, payload.projectId);
  if (options.completeJob) {
    await repository.updateJob(jobId, {
      status: "completed",
      progress: 1,
      message: `Capture completed. ${styles.length} style token(s) and ${clusters.length} template cluster(s) available.`
    });
  }
}

export async function processCaptureJob(repository: LocalStoreRepository, jobId: string): Promise<void> {
  const job = await repository.getJob(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} was not found.`);
  }

  const queuedJobs = await repository.listQueuedJobs();
  const queued = queuedJobs.find((entry) => entry.id === jobId);
  if (!queued) {
    return;
  }

  try {
    await repository.updateJob(jobId, {
      status: "running",
      progress: 0.2,
      message: "Starting capture."
    });

    const serializedPage = queued.payload.serializedPage as SerializedPage | undefined;
    if (serializedPage) {
      await finalizeCapture(repository, jobId, {
        projectId: queued.projectId,
        pageId: queued.pageId ?? "",
        captureId: String(queued.payload.captureId),
        mode: String(queued.payload.mode) === "style-guide" ? "style-guide" : "page",
        serializedPage
      });
      return;
    }

    const url = String(queued.payload.url ?? queued.sourceUrl ?? "");
    const pageId = String(queued.payload.pageId ?? queued.pageId ?? "");
    const captureId = String(queued.payload.captureId ?? "");
    const page = await capturePublicUrl(url, routeSettings(queued.payload));

    await repository.updateJob(jobId, {
      progress: 0.62,
      message: "Fetched page and discovered routes."
    });

    await finalizeCapture(repository, jobId, {
      projectId: queued.projectId,
      pageId,
      captureId,
      mode: String(queued.payload.mode) === "style-guide" ? "style-guide" : "page",
      serializedPage: page
    });
  } catch (error) {
    await repository.updateJob(jobId, {
      status: "failed",
      progress: 1,
      errorMessage: error instanceof Error ? error.message : "Capture failed.",
      message: "Capture failed."
    });
  }
}

export async function processCrawlJob(repository: LocalStoreRepository, jobId: string): Promise<void> {
  const queuedJobs = await repository.listQueuedJobs();
  const job = queuedJobs.find((entry) => entry.id === jobId);
  if (!job) {
    return;
  }

  const crawlRunId = String(job.payload.crawlRunId ?? job.crawlRunId ?? "");
  const crawlRun = await repository.getCrawlRun(crawlRunId);
  if (!crawlRun) {
    await repository.updateJob(jobId, {
      status: "failed",
      errorMessage: `Crawl run ${crawlRunId} not found.`
    });
    return;
  }

  try {
    const settings = routeSettings(job.payload);
    await repository.updateJob(jobId, {
      status: "running",
      progress: 0.08,
      message: "Starting crawl orchestration."
    });
    await repository.updateCrawlRun(crawlRunId, { status: "running" });

    const initialRoutes = (job.payload.routes as DiscoveredRoute[] | undefined) ?? [
      {
        url: crawlRun.seedUrl,
        pathname: new URL(crawlRun.seedUrl).pathname || "/",
        depth: 0,
        source: "manual",
        skippedReason: null
      }
    ];

    await repository.queueCrawlRoutes(crawlRunId, initialRoutes);

    let visited = 0;
    let queuedRoutes = await repository.listCrawlRoutes(crawlRunId);
    while (queuedRoutes.some((route) => route.status === "queued") && visited < crawlRun.maxPages) {
      const route = queuedRoutes
        .filter((entry) => entry.status === "queued")
        .sort((left, right) => left.depth - right.depth)[0];
      if (!route) {
        break;
      }

      if (route.depth > crawlRun.maxDepth) {
        await repository.updateCrawlRoute(route.id, {
          status: "skipped",
          skipReason: "Depth limit exceeded."
        });
        queuedRoutes = await repository.listCrawlRoutes(crawlRunId);
        continue;
      }

      try {
        const page = await repository.getOrCreatePage(crawlRun.projectId, route.url);
        const capture = await repository.createCaptureRecord({
          projectId: crawlRun.projectId,
          pageId: page.id,
          mode: "page",
          source: "url",
          status: "queued",
          screenshotUrl: null,
          serializedPage: null,
          normalized: null
        });

        const serializedPage = await capturePublicUrl(route.url, settings);
        await finalizeCapture(
          repository,
          jobId,
          {
            projectId: crawlRun.projectId,
            pageId: page.id,
            captureId: capture.id,
            mode: "page",
            serializedPage
          },
          {
            completeJob: false
          }
        );

        await repository.updateCrawlRoute(route.id, {
          status: "visited",
          pageId: page.id
        });

        const nextRoutes = serializedPage.links
          .filter((candidate) => shouldIncludeRoute(candidate.url, crawlRun.siteOrigin, settings))
          .map((candidate) => ({
            ...candidate,
            depth: Math.min(candidate.depth, route.depth + 1)
          }))
          .slice(0, Math.max(0, crawlRun.maxPages - visited));

        await repository.queueCrawlRoutes(crawlRunId, nextRoutes);
        visited += 1;
        await repository.updateJob(jobId, {
          progress: Math.min(0.94, visited / Math.max(1, crawlRun.maxPages)),
          message: `Captured ${visited} route(s) so far.`
        });
      } catch (error) {
        await repository.updateCrawlRoute(route.id, {
          status: "skipped",
          skipReason: error instanceof Error ? error.message : "Route capture failed."
        });
      }

      queuedRoutes = await repository.listCrawlRoutes(crawlRunId);
    }

    const clusters = await refreshPatterns(repository, crawlRun.projectId);
    await repository.updateCrawlRun(crawlRunId, { status: "completed" });
    await repository.updateJob(jobId, {
      status: "completed",
      progress: 1,
      message: `Crawl completed with ${clusters.length} template cluster(s).`
    });
  } catch (error) {
    await repository.updateCrawlRun(crawlRunId, { status: "failed" });
    await repository.updateJob(jobId, {
      status: "failed",
      progress: 1,
      errorMessage: error instanceof Error ? error.message : "Crawl failed.",
      message: "Crawl failed."
    });
  }
}
