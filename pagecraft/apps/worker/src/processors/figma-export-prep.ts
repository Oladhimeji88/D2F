import { LocalStoreRepository } from "@pagecraft/capture-core";

export async function runFigmaExportPrepJob(repository: LocalStoreRepository, jobId: string) {
  await repository.updateJob(jobId, {
    status: "completed",
    progress: 1,
    message: "Figma export preparation placeholder completed."
  });
}
