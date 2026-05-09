export function normalizeGenerationStatus(status: string | null | undefined) {
  return String(status ?? "").toLowerCase();
}

export function isGenerationActive(status: string | null | undefined) {
  return ["creating", "queued", "processing", "progress"].includes(normalizeGenerationStatus(status));
}

export function isGenerationQueueBlocking(status: string | null | undefined) {
  return ["creating", "queued"].includes(normalizeGenerationStatus(status));
}

export function countActiveGenerationJobs(jobs: Array<{ status: string | null | undefined }>) {
  return jobs.filter((job) => isGenerationQueueBlocking(job.status)).length;
}

export function canCreateGenerationJob(jobs: Array<{ status: string | null | undefined }>, maxActive = 4) {
  return countActiveGenerationJobs(jobs) < maxActive;
}
