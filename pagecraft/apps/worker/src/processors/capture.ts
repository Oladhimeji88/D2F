import { LocalStoreRepository, processCaptureJob } from "@pagecraft/capture-core";

export async function runCaptureJob(repository: LocalStoreRepository, jobId: string) {
  await processCaptureJob(repository, jobId);
}
