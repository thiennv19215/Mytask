import { getJobStatus } from "./generation-api";
import { upsertGenerationJob } from "./generation-store";

const activePolls = new Map<string, AbortController>();
const terminalStatuses = new Set(["success", "failed"]);

function wait(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = window.setTimeout(resolve, ms);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeoutId);
        reject(new DOMException("Polling aborted", "AbortError"));
      },
      { once: true }
    );
  });
}

export function startJobPolling(jobId: string, intervalMs = 10000) {
  if (activePolls.has(jobId)) {
    return;
  }

  const controller = new AbortController();
  activePolls.set(jobId, controller);

  void pollJob(jobId, intervalMs, controller);
}

export function stopJobPolling(jobId: string) {
  activePolls.get(jobId)?.abort();
  activePolls.delete(jobId);
}

async function pollJob(jobId: string, intervalMs: number, controller: AbortController) {
  try {
    while (!controller.signal.aborted) {
      const response = await getJobStatus(jobId);

      if (response.job) {
        upsertGenerationJob(response.job);

        if (terminalStatuses.has(String(response.job.status).toLowerCase())) {
          break;
        }
      }

      await wait(intervalMs, controller.signal);
    }
  } catch (error) {
    if (!(error instanceof DOMException && error.name === "AbortError")) {
      console.error(error);
    }
  } finally {
    activePolls.delete(jobId);
  }
}
