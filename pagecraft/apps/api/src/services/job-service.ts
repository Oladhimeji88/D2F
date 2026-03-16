import { processCaptureJob, processCrawlJob } from "@pagecraft/capture-core";

import type { ApiEnv } from "../lib/env";
import type { LocalStoreRepository } from "@pagecraft/capture-core";

export class JobService {
  constructor(
    private readonly repository: LocalStoreRepository,
    private readonly env: ApiEnv
  ) {}

  async runInline(jobId: string): Promise<void> {
    if (!this.env.PAGECRAFT_INLINE_JOBS) {
      return;
    }

    const job = await this.repository.getJob(jobId);
    if (!job) {
      return;
    }

    if (job.kind === "crawl") {
      await processCrawlJob(this.repository, jobId);
      return;
    }

    await processCaptureJob(this.repository, jobId);
  }
}
