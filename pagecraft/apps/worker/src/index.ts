import { LocalStoreRepository } from "@pagecraft/capture-core";

import { getEnv } from "./lib/env";
import { runCaptureJob } from "./processors/capture";
import { runCrawlJob } from "./processors/crawl";
import { runFigmaExportPrepJob } from "./processors/figma-export-prep";

async function runPendingJobs() {
  const repository = new LocalStoreRepository();
  const queuedJobs = await repository.listQueuedJobs();

  for (const job of queuedJobs) {
    if (job.kind === "crawl") {
      await runCrawlJob(repository, job.id);
      continue;
    }

    if (job.kind === "capture" || job.kind === "style-guide") {
      await runCaptureJob(repository, job.id);
      continue;
    }

    await runFigmaExportPrepJob(repository, job.id);
  }
}

async function bootstrap() {
  const env = getEnv();
  await runPendingJobs();
  setInterval(() => {
    void runPendingJobs();
  }, env.WORKER_POLL_INTERVAL_MS);
}

void bootstrap();
