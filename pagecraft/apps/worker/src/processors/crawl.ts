import { LocalStoreRepository, processCrawlJob } from "@pagecraft/capture-core";

export async function runCrawlJob(repository: LocalStoreRepository, jobId: string) {
  await processCrawlJob(repository, jobId);
}
