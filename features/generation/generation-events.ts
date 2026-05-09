"use client";

export const useImageForVideoEventName = "generation:use-image-for-video";
export const useImageForVideoStorageKey = "generation:pending-use-image-for-video";

export type UseImageForVideoDetail = {
  originalUrl: string;
  payloadUrl: string;
  previewUrl: string;
  source: "image-result";
  prompt: string | null;
  jobId: string | null;
};

export function dispatchUseImageForVideoEvent(detail: UseImageForVideoDetail) {
  window.sessionStorage.setItem(useImageForVideoStorageKey, JSON.stringify(detail));
  window.dispatchEvent(new CustomEvent<UseImageForVideoDetail>(useImageForVideoEventName, { detail }));
}
