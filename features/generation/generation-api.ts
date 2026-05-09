import type { CreateImagePayload, CreateVideoPayload, GenerationResponse } from "./generation-types";

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json().catch(() => null);

  if (!response.ok && data?.job) {
    return data as T;
  }

  if (!response.ok) {
    const message =
      data?.message || data?.error_message || `Request failed: ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function createImageJob(payload: CreateImagePayload) {
  return requestJson<GenerationResponse>("/api/generation/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      type: "image",
      prompt: payload.prompt,
      aspectRatio: payload.aspectRatio,
      images: payload.images ?? []
    })
  });
}

export async function createVideoJob(payload: CreateVideoPayload) {
  return requestJson<GenerationResponse>("/api/generation/video", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      prompt: payload.prompt,
      aspectRatio: payload.aspectRatio,
      images: payload.images ?? []
    })
  });
}

export async function getJobStatus(jobId: string) {
  const params = new URLSearchParams({ jobId });
  return requestJson<GenerationResponse>(`/api/generation/job-status?${params.toString()}`);
}
