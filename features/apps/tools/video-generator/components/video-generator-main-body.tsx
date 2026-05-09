"use client";

import { useEffect, useRef, useState } from "react";
import { AppsIcon } from "../../../components/apps-icons";
import { downloadMedia } from "@/features/downloads/download-media";
import { createVideoJob } from "@/features/generation/generation-api";
import {
  useImageForVideoEventName,
  useImageForVideoStorageKey,
  type UseImageForVideoDetail
} from "@/features/generation/generation-events";
import { useHydrateGenerationHistory } from "@/features/generation/generation-history";
import { upsertGenerationJob, useGenerationJobs } from "@/features/generation/generation-store";
import { startJobPolling } from "@/features/generation/polling-manager";
import { countActiveGenerationJobs, isGenerationActive } from "@/features/generation/generation-status";
import type { GenerationAspectRatio, GenerationJob } from "@/features/generation/generation-types";
import { uploadImage } from "@/features/uploads/upload-api";
import { getPayloadImageUrl, getPreviewImageUrl } from "@/features/uploads/upload-image-url";
import styles from "./video-generator-main-body.module.css";

type VideoCard = {
  id: string;
  model: string;
  prompt: string;
  ratio: string;
  duration: string;
  quality: string;
  createdAt: string;
  status: string;
  resultUrl: string | null;
  errorMessage: string | null;
};

type ReferenceImage = {
  id: string;
  fileName: string;
  originalUrl: string;
  payloadUrl: string;
  previewUrl: string;
  key: string;
  status: "uploading" | "ready" | "failed";
  errorMessage?: string;
};

function mapVideoRatioToAspectRatio(ratio: string): GenerationAspectRatio {
  if (ratio === "Landscape") {
    return "landscape";
  }

  return "portrait";
}

function mapAspectRatioToVideoRatio(aspectRatio: string | null): string {
  if (aspectRatio === "landscape") {
    return "Landscape";
  }

  return "Portrait";
}

function getVideoStatusKind(status: string) {
  const normalizedStatus = status.toLowerCase();

  if (isGenerationActive(normalizedStatus)) {
    return "pending";
  }

  if (normalizedStatus === "failed") {
    return "failed";
  }

  if (normalizedStatus === "success") {
    return "success";
  }

  return "idle";
}

function mapJobToVideoCard(job: GenerationJob): VideoCard {
  return {
    id: job.id ?? crypto.randomUUID(),
    model: "Veo3.1 Fast",
    prompt: job.prompt ?? "Video generation job",
    ratio: mapAspectRatioToVideoRatio(job.aspectRatio),
    duration: "8s",
    quality: "HD",
    createdAt: "Generation",
    status: String(job.status),
    resultUrl: job.resultUrl,
    errorMessage: job.errorMessage
  };
}

export function VideoGeneratorMainBody() {
  useHydrateGenerationHistory("video");

  const [activeMode, setActiveMode] = useState("Create Video");
  const [segment, setSegment] = useState("Frame");
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("Portrait");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [optimisticVideos, setOptimisticVideos] = useState<VideoCard[]>([]);
  const [referenceImages, setReferenceImages] = useState<Array<ReferenceImage | null>>([null, null]);
  const [frameMessage, setFrameMessage] = useState("");
  const startFrameInputRef = useRef<HTMLInputElement>(null);
  const endFrameInputRef = useRef<HTMLInputElement>(null);
  const videoJobs = useGenerationJobs("video");

  const generatedVideos = videoJobs.map(mapJobToVideoCard);
  const generatedVideoIds = new Set(generatedVideos.map((video) => video.id));
  const visibleOptimisticVideos = optimisticVideos.filter((video) => !generatedVideoIds.has(video.id));
  const videos = [...visibleOptimisticVideos, ...generatedVideos];
  const selectedVideo = videos.find((video) => video.id === selectedVideoId) ?? videos[0] ?? null;
  const selectedVideoStatusKind = selectedVideo ? getVideoStatusKind(selectedVideo.status) : "idle";
  const isPreviewPending = selectedVideoStatusKind === "pending";
  const isPreviewFailed = selectedVideoStatusKind === "failed";
  const previewClass = selectedVideo?.ratio === "Portrait" ? styles.previewPortrait : styles.previewLandscape;
  const hasUploadingReferences = referenceImages.some((image) => image?.status === "uploading");
  const videoQueueCount = countActiveGenerationJobs([...visibleOptimisticVideos, ...generatedVideos]);
  const isVideoQueueFull = videoQueueCount >= 4;

  function addImageResultReference(detail: UseImageForVideoDetail) {
    if (!detail.originalUrl || !detail.payloadUrl || !detail.previewUrl) {
      return;
    }

    const referenceImage: ReferenceImage = {
      id: crypto.randomUUID(),
      fileName: detail.prompt?.trim() || "Generated image",
      originalUrl: detail.originalUrl,
      payloadUrl: detail.payloadUrl,
      previewUrl: detail.previewUrl,
      key: detail.jobId ? `image-result-${detail.jobId}` : `image-result-${Date.now()}`,
      status: "ready"
    };

    setReferenceImages((images) => {
      const duplicateIndex = images.findIndex((image) => image?.originalUrl === detail.originalUrl);

      if (duplicateIndex >= 0) {
        setFrameMessage(duplicateIndex === 0 ? "Anh nay da nam o Start frame." : "Anh nay da nam o End frame.");
        return images;
      }

      const emptyIndex = images.findIndex((image) => !image);
      const targetIndex = emptyIndex >= 0 ? emptyIndex : 1;
      const nextImages = [...images];
      nextImages[targetIndex] = referenceImage;

      setFrameMessage(
        targetIndex === 0
          ? "Da dua anh ket qua sang Start frame."
          : emptyIndex >= 0
            ? "Da dua anh ket qua sang End frame."
            : "Da du 2 anh reference, anh ket qua da thay End frame."
      );

      return nextImages;
    });
  }

  useEffect(() => {
    const pendingRaw = window.sessionStorage.getItem(useImageForVideoStorageKey);

    if (pendingRaw) {
      window.sessionStorage.removeItem(useImageForVideoStorageKey);

      try {
        addImageResultReference(JSON.parse(pendingRaw) as UseImageForVideoDetail);
      } catch {
        setFrameMessage("Khong doc duoc anh ket qua vua chuyen sang.");
      }
    }

    function handleUseImageForVideo(event: Event) {
      addImageResultReference((event as CustomEvent<UseImageForVideoDetail>).detail);
    }

    window.addEventListener(useImageForVideoEventName, handleUseImageForVideo);
    return () => window.removeEventListener(useImageForVideoEventName, handleUseImageForVideo);
  }, []);

  async function handleCreateVideo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();

    if (!cleanPrompt || isVideoQueueFull || hasUploadingReferences) {
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const optimisticVideo: VideoCard = {
      id: optimisticId,
      model: "Veo3.1 Fast",
      prompt: cleanPrompt,
      ratio,
      duration: "8s",
      quality: "HD",
      createdAt: "Generation",
      status: "creating",
      resultUrl: null,
      errorMessage: null
    };

    setOptimisticVideos((items) => [optimisticVideo, ...items]);
    setSelectedVideoId(optimisticId);

    try {
      const payloadImages = referenceImages
        .filter((image): image is ReferenceImage => Boolean(image && image.status === "ready"))
        .map((image) => image.payloadUrl);

      const response = await createVideoJob({
        prompt: cleanPrompt,
        aspectRatio: mapVideoRatioToAspectRatio(ratio),
        images: payloadImages
      });

      if (!response.job?.id) {
        throw new Error(response.message || "Missing job id");
      }

      const confirmedVideo = mapJobToVideoCard(response.job);
      upsertGenerationJob(response.job);
      setOptimisticVideos((items) => items.map((item) => (item.id === optimisticId ? confirmedVideo : item)));
      setSelectedVideoId(confirmedVideo.id);
      startJobPolling(response.job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create video failed";
      setOptimisticVideos((items) =>
        items.map((item) =>
          item.id === optimisticId ? { ...item, status: "failed", errorMessage: message, createdAt: "Failed" } : item
        )
      );
    }
  }

  async function handleFrameFile(slotIndex: number, files: FileList | null) {
    const file = files?.[0];
    if (!file) {
      return;
    }

    const id = crypto.randomUUID();
    const uploadingImage: ReferenceImage = {
      id,
      fileName: file.name,
      originalUrl: "",
      payloadUrl: "",
      previewUrl: "",
      key: "",
      status: "uploading"
    };

    setReferenceImages((images) => images.map((image, index) => (index === slotIndex ? uploadingImage : image)));

    try {
      const uploaded = await uploadImage(file, { folder: "video-generator" });

      if (!uploaded.success || !uploaded.asset) {
        throw new Error(uploaded.message || "Upload frame failed");
      }

      const asset = uploaded.asset;

      setReferenceImages((images) =>
        images.map((image, index) =>
          index === slotIndex
            ? {
                ...uploadingImage,
                originalUrl: asset.url,
                payloadUrl: getPayloadImageUrl(asset.url),
                previewUrl: getPreviewImageUrl(asset.url),
                key: asset.key,
                status: "ready"
              }
            : image
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload frame failed";
      setReferenceImages((images) =>
        images.map((image, index) =>
          index === slotIndex ? { ...uploadingImage, status: "failed", errorMessage: message } : image
        )
      );
    }
  }

  function removeFrame(slotIndex: number) {
    setReferenceImages((images) => images.map((image, index) => (index === slotIndex ? null : image)));
  }

  function handleDownloadVideo(video: VideoCard | null) {
    if (!video?.resultUrl) {
      return;
    }

    void downloadMedia({
      fallbackFileName: "generated-video",
      fileName: `generated-video-${video.id}`,
      url: video.resultUrl
    });
  }

  function renderUploadBox(slotIndex: number, label: string, inputRef: React.RefObject<HTMLInputElement | null>) {
    const image = referenceImages[slotIndex];

    return (
      <div className={styles.uploadSlot}>
        <input
          accept="image/jpeg,image/png,image/webp"
          className={styles.hiddenFileInput}
          onChange={(event) => {
            void handleFrameFile(slotIndex, event.target.files);
            event.target.value = "";
          }}
          ref={inputRef}
          type="file"
        />
        <button
          className={styles.uploadBox}
          data-status={image?.status ?? "empty"}
          disabled={hasUploadingReferences}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          {image?.previewUrl ? <img alt={image.fileName} src={image.previewUrl} /> : <AppsIcon name="image" />}
          <strong>{label}</strong>
          <span>{image?.status === "uploading" ? "Uploading..." : image?.fileName ?? "Upload image"}</span>
          {image?.errorMessage ? <small>{image.errorMessage}</small> : null}
        </button>
        {image ? (
          <button className={styles.removeFrameButton} onClick={() => removeFrame(slotIndex)} type="button">
            Remove
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <section className={styles.videoToolBody} aria-label="AI video generator">
      <aside className={styles.configPanel}>
        <form className={styles.generatorForm} onSubmit={handleCreateVideo}>
          <div className={styles.modeTabs} aria-label="Video mode">
            {["Create Video", "Motion Control"].map((item) => (
              <button
                className={item === activeMode ? styles.activeMode : ""}
                key={item}
                onClick={() => setActiveMode(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.segmentedControl} aria-label="Input type">
            {["Frame", "Elements"].map((item) => (
              <button
                className={item === segment ? styles.activeSegment : ""}
                key={item}
                onClick={() => setSegment(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>

          <div className={styles.uploadGrid}>
            {renderUploadBox(0, "Start frame", startFrameInputRef)}
            {renderUploadBox(1, "End frame", endFrameInputRef)}
          </div>
          {frameMessage ? <p className={styles.frameMessage}>{frameMessage}</p> : null}

          <label className={styles.fieldGroup}>
            <span>Prompt</span>
            <textarea
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the scene, camera movement, lighting, and mood..."
              rows={4}
              value={prompt}
            />
          </label>

          <div className={styles.settingsGrid}>
            <div className={styles.compactOptions}>
              <label className={styles.optionGroup}>
                <span>Aspect</span>
                <select onChange={(event) => setRatio(event.target.value)} value={ratio}>
                  <option>Portrait</option>
                  <option>Landscape</option>
                </select>
              </label>
            </div>
          </div>

          <button
            className={styles.primaryButton}
            disabled={!prompt.trim() || hasUploadingReferences || isVideoQueueFull}
            type="submit"
          >
            <AppsIcon compact name="spark" />
            {isVideoQueueFull ? "Wait a moment" : "Create video"}
          </button>
        </form>
      </aside>

      <div className={styles.workspaceGroup}>
        <main className={styles.previewPanel}>
          <div className={styles.previewHeader}>
            <h2>Thư viện video</h2>
          </div>

          <section className={`${styles.videoPreview} ${previewClass}`} aria-label="Video preview">
            <div className={styles.previewScene}>
              {selectedVideo?.resultUrl ? (
                <video className={styles.generatedVideo} controls src={selectedVideo.resultUrl} />
              ) : null}
              <div>
                <strong>{selectedVideo?.prompt ?? "No videos yet"}</strong>
                {!isPreviewPending ? (
                  <em>{selectedVideo ? selectedVideo.errorMessage ?? selectedVideo.status : "Generated videos will appear here."}</em>
                ) : null}
              </div>
              {selectedVideo && !selectedVideo.resultUrl && isPreviewPending ? (
                <div aria-label="Video is generating" className={styles.loadingOverlay} role="status">
                  <div className={styles.loadingStatus}>
                    <div className={styles.loadingIndicator} />
                    <strong>Đang tạo video...</strong>
                  </div>
                </div>
              ) : null}
              {selectedVideo && !selectedVideo.resultUrl && isPreviewFailed ? (
                <div aria-label="Video generation failed" className={styles.failedOverlay} role="status">
                  <AppsIcon name="video" />
                  <strong>Video failed</strong>
                  <p>{selectedVideo.errorMessage ?? "Generation failed. Try again with a different prompt."}</p>
                </div>
              ) : null}
              {selectedVideo && !selectedVideo.resultUrl && !isPreviewPending && !isPreviewFailed ? (
                <button aria-label="Preview status" className={styles.playButton} type="button">
                  <span />
                </button>
              ) : null}
              <div className={styles.previewIconActions}>
                <button
                  aria-label="Download video"
                  disabled={!selectedVideo?.resultUrl}
                  onClick={() => handleDownloadVideo(selectedVideo)}
                  type="button"
                >
                  <AppsIcon name="download" />
                </button>
                <button aria-label="Remove video" type="button">
                  x
                </button>
              </div>
            </div>
          </section>

        </main>

        <aside className={styles.historyPanel}>
          <div className={styles.historyHeader}>
            <p className={styles.eyebrow}>LIBRARY</p>
            <h2>Thư viện video</h2>
          </div>
          {videos.length > 0 ? (
            <div className={styles.historyList}>
              {videos.map((video) => (
                <button
                  className={`${styles.historyItem} ${video.id === selectedVideo?.id ? styles.activeHistoryItem : ""}`}
                  key={video.id}
                  onClick={() => setSelectedVideoId(video.id)}
                  type="button"
                >
                  <div className={styles.historyThumb}>
                    {video.resultUrl ? <video muted playsInline src={video.resultUrl} /> : <AppsIcon name="video" />}
                  </div>
                  <div>
                    <strong>{video.model}</strong>
                    <p>{video.prompt}</p>
                    <span>
                      {video.status} - {video.duration} - {video.ratio} - {video.createdAt}
                    </span>
                    {video.errorMessage ? <p className={styles.errorText}>{video.errorMessage}</p> : null}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <AppsIcon name="video" />
              <strong>No videos yet</strong>
              <p>New videos will appear here after generation.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}
