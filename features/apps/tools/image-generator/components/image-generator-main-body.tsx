"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AppsIcon } from "../../../components/apps-icons";
import { downloadMedia } from "@/features/downloads/download-media";
import { createImageJob } from "@/features/generation/generation-api";
import { dispatchUseImageForVideoEvent } from "@/features/generation/generation-events";
import { useHydrateGenerationHistory } from "@/features/generation/generation-history";
import { upsertGenerationJob, useGenerationJobs } from "@/features/generation/generation-store";
import { startJobPolling } from "@/features/generation/polling-manager";
import { countActiveGenerationJobs, isGenerationActive } from "@/features/generation/generation-status";
import type { GenerationAspectRatio } from "@/features/generation/generation-types";
import { uploadImage } from "@/features/uploads/upload-api";
import { getPayloadImageUrl, getPreviewImageUrl } from "@/features/uploads/upload-image-url";
import styles from "./image-generator-main-body.module.css";

const settingOptions = {
  ratio: ["Portrait", "Square", "Landscape"]
};

const draggedResultImageMimeType = "application/x-genjob-result-image";
type SettingKey = keyof typeof settingOptions;

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

type SelectedImage = {
  prompt: string | null;
  resultUrl: string;
};

type DraggedResultImage = {
  id: string;
  prompt: string | null;
  url: string;
};

type OptimisticImageJob = {
  id: string;
  prompt: string;
  status: "creating" | "queued" | "processing" | "progress" | "failed";
  aspectRatio: GenerationAspectRatio;
  resultUrl: null;
  errorMessage: string | null;
};

function getJobStatusKind(status: string | null | undefined) {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (isGenerationActive(normalizedStatus)) {
    return "pending";
  }

  if (normalizedStatus === "failed") {
    return "failed";
  }

  if (normalizedStatus === "success") {
    return "success";
  }

  return "preview";
}

function mapRatioToAspectRatio(ratio: string): GenerationAspectRatio {
  if (ratio === "Square") {
    return "square";
  }

  if (ratio === "Landscape") {
    return "landscape";
  }

  return "portrait";
}

function getImageLoadingLabel(status: string | null | undefined) {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (normalizedStatus === "creating") {
    return "Dang gui yeu cau...";
  }

  if (normalizedStatus === "queued") {
    return "Dang cho xu ly...";
  }

  if (normalizedStatus === "processing" || normalizedStatus === "progress") {
    return "Dang tao anh...";
  }

  return "Dang xu ly...";
}

export function ImageGeneratorMainBody() {
  useHydrateGenerationHistory("image");
  const router = useRouter();

  const [prompt, setPrompt] = useState("");
  const [openSetting, setOpenSetting] = useState<SettingKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [isReferenceDropActive, setIsReferenceDropActive] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [optimisticImageJobs, setOptimisticImageJobs] = useState<OptimisticImageJob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageJobs = useGenerationJobs("image");
  const [settings, setSettings] = useState<Record<SettingKey, string>>({
    ratio: "Portrait"
  });

  async function handleGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt || isImageQueueFull || hasUploadingReferences) {
      return;
    }

    const optimisticId = `local-${Date.now()}`;
    const submittedAspectRatio = mapRatioToAspectRatio(settings.ratio);
    setOptimisticImageJobs((jobs) => [
      {
        id: optimisticId,
        prompt: cleanPrompt,
        status: "creating",
        aspectRatio: submittedAspectRatio,
        resultUrl: null,
        errorMessage: null
      },
      ...jobs
    ]);

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const payloadImages = referenceImages
        .filter((image) => image.status === "ready")
        .map((image) => image.payloadUrl);

      const response = await createImageJob({
        type: "image",
        prompt: cleanPrompt,
        aspectRatio: submittedAspectRatio,
        images: payloadImages
      });

      const createdJob = response.job;

      if (!createdJob?.id) {
        throw new Error(response.message || "Missing job id");
      }

      const createdJobId = createdJob.id;
      const confirmedJob = {
        ...createdJob,
        aspectRatio: createdJob.aspectRatio ?? submittedAspectRatio
      };

      setOptimisticImageJobs((jobs) =>
        jobs.map((job) =>
          job.id === optimisticId
            ? {
                ...job,
                id: createdJobId,
                status: confirmedJob.status === "processing" ? "processing" : "queued",
                aspectRatio: confirmedJob.aspectRatio as GenerationAspectRatio,
                errorMessage: confirmedJob.errorMessage
              }
            : job
        )
      );
      upsertGenerationJob(confirmedJob);
      startJobPolling(createdJobId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Create image failed";
      setErrorMessage(message);
      setOptimisticImageJobs((jobs) =>
        jobs.map((job) => (job.id === optimisticId ? { ...job, status: "failed", errorMessage: message } : job))
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const imageJobIds = new Set(imageJobs.map((job) => job.id).filter(Boolean));
  const visibleOptimisticImageJobs = optimisticImageJobs.filter((job) => !imageJobIds.has(job.id));
  const visibleImages = [...visibleOptimisticImageJobs, ...imageJobs];
  const imageQueueCount = countActiveGenerationJobs(visibleImages);
  const isImageQueueFull = imageQueueCount >= 4;

  function handleDownloadImage(url: string, fileName?: string) {
    void downloadMedia({
      fallbackFileName: "generated-image",
      fileName,
      url
    });
  }

  function handleUseImageForVideo(
    event: React.MouseEvent<HTMLButtonElement>,
    image: { id: string | null; prompt: string | null; resultUrl: string | null }
  ) {
    event.stopPropagation();

    if (!image.resultUrl) {
      return;
    }

    dispatchUseImageForVideoEvent({
      originalUrl: image.resultUrl,
      payloadUrl: getPayloadImageUrl(image.resultUrl),
      previewUrl: getPreviewImageUrl(image.resultUrl),
      source: "image-result",
      prompt: image.prompt,
      jobId: image.id
    });
    router.push("/apps/video-generator");
  }

  function addResultImageAsReference(resultImage: DraggedResultImage) {
    setErrorMessage("");

    if (referenceImages.some((image) => image.originalUrl === resultImage.url)) {
      return;
    }

    if (referenceImages.length >= 8) {
      setErrorMessage("Image jobs support up to 8 reference images");
      return;
    }

    setReferenceImages((images) => [
      ...images,
      {
        id: crypto.randomUUID(),
        fileName: resultImage.prompt?.trim() || "Generated image",
        originalUrl: resultImage.url,
        payloadUrl: getPayloadImageUrl(resultImage.url),
        previewUrl: getPreviewImageUrl(resultImage.url),
        key: `result-${resultImage.id}`,
        status: "ready"
      }
    ]);
  }

  function handleResultImageDragStart(event: React.DragEvent<HTMLElement>, resultImage: DraggedResultImage) {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(draggedResultImageMimeType, JSON.stringify(resultImage));
    event.dataTransfer.setData("text/uri-list", resultImage.url);
  }

  function handleReferenceDragOver(event: React.DragEvent<HTMLElement>) {
    if (event.dataTransfer.types.includes(draggedResultImageMimeType)) {
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      setIsReferenceDropActive(true);
    }
  }

  function handleReferenceDrop(event: React.DragEvent<HTMLElement>) {
    const rawResultImage = event.dataTransfer.getData(draggedResultImageMimeType);

    if (!rawResultImage) {
      setIsReferenceDropActive(false);
      return;
    }

    event.preventDefault();
    setIsReferenceDropActive(false);

    try {
      const resultImage = JSON.parse(rawResultImage) as DraggedResultImage;

      if (resultImage.url) {
        addResultImageAsReference(resultImage);
      }
    } catch {
      setErrorMessage("Could not use this image as a reference");
    }
  }

  function handleSettingSelect(key: SettingKey, value: string) {
    setSettings((currentSettings) => ({ ...currentSettings, [key]: value }));
    setOpenSetting(null);
  }

  async function handleReferenceFiles(files: FileList | null) {
    const selectedFiles = Array.from(files ?? []);
    if (!selectedFiles.length) {
      return;
    }

    setErrorMessage("");

    const remainingSlots = Math.max(0, 8 - referenceImages.length);
    const filesToUpload = selectedFiles.slice(0, remainingSlots);

    if (!filesToUpload.length) {
      setErrorMessage("Image jobs support up to 8 reference images");
      return;
    }

    for (const file of filesToUpload) {
      const id = crypto.randomUUID();
      setReferenceImages((images) => [
        ...images,
        {
          id,
          fileName: file.name,
          originalUrl: "",
          payloadUrl: "",
          previewUrl: "",
          key: "",
          status: "uploading"
        }
      ]);

      try {
        const uploaded = await uploadImage(file, { folder: "image-generator" });

        if (!uploaded.success || !uploaded.asset) {
          throw new Error(uploaded.message || "Upload image failed");
        }

        const asset = uploaded.asset;

        setReferenceImages((images) =>
          images.map((image) =>
            image.id === id
              ? {
                  ...image,
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
        const message = error instanceof Error ? error.message : "Upload image failed";
        setReferenceImages((images) =>
          images.map((image) => (image.id === id ? { ...image, status: "failed", errorMessage: message } : image))
        );
      }
    }
  }

  function removeReferenceImage(id: string) {
    setReferenceImages((images) => images.filter((image) => image.id !== id));
  }

  const settingControls: Array<{ key: SettingKey; label: string }> = [
    { key: "ratio", label: "Aspect" }
  ];
  const hasUploadingReferences = referenceImages.some((image) => image.status === "uploading");

  return (
    <section className={styles.imageToolBody} aria-label="Image generator">
      <div className={styles.imageGallery} aria-label="Image preview list">
        {visibleImages.length > 0 ? (
          visibleImages.map((item, index) => {
            const statusKind = getJobStatusKind(item.status);
            const isSuccessfulImage = statusKind === "success" && Boolean(item.resultUrl);

            return (
              <article
                aria-label={item.prompt ?? "Generated image"}
                className={`${styles.galleryTile} ${styles[`tileTone${index % 6}`]}`}
                data-status={statusKind}
                draggable={isSuccessfulImage}
                onDragStart={(event) => {
                  if (isSuccessfulImage && item.resultUrl) {
                    handleResultImageDragStart(event, {
                      id: item.id ?? `image-${index}`,
                      prompt: item.prompt,
                      url: item.resultUrl
                    });
                  }
                }}
                key={item.id}
              >
                {isSuccessfulImage ? (
                  <>
                    <button
                      aria-label="Open generated image"
                      className={styles.tileOpenButton}
                      onClick={() =>
                        setSelectedImage({
                          prompt: item.prompt,
                          resultUrl: item.resultUrl ?? ""
                        })
                      }
                      type="button"
                    >
                      <img alt={item.prompt ?? "Generated image"} className={styles.generatedImage} src={item.resultUrl ?? ""} />
                    </button>
                    <button
                      aria-label="Download generated image"
                      className={styles.downloadImageButton}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDownloadImage(item.resultUrl ?? "", `generated-image-${item.id}`);
                      }}
                      type="button"
                    >
                      <AppsIcon compact name="download" />
                    </button>
                    <button
                      aria-label="Use generated image for video"
                      className={styles.useForVideoButton}
                      onClick={(event) =>
                        handleUseImageForVideo(event, {
                          id: item.id,
                          prompt: item.prompt,
                          resultUrl: item.resultUrl ?? ""
                        })
                      }
                      type="button"
                    >
                      <AppsIcon compact name="video" />
                    </button>
                  </>
                ) : statusKind === "pending" ? (
                  <div aria-label="Image is generating" className={styles.tileLoading} role="status">
                    <span />
                    <strong>{getImageLoadingLabel(item.status)}</strong>
                  </div>
                ) : (
                  <div className={styles.tileStateContent}>
                    {statusKind === "failed" ? (
                      <div className={styles.tileErrorState}>
                        <strong>Failed</strong>
                        <span>{item.errorMessage ?? "Image generation failed"}</span>
                      </div>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })
        ) : (
          <div className={styles.emptyGalleryState}>
            <AppsIcon name="image" />
            <strong>No images yet</strong>
            <p>Upload a reference image or describe what you want to create.</p>
          </div>
        )}
      </div>

      {selectedImage ? (
        <div className={styles.imageViewerBackdrop} role="presentation" onClick={() => setSelectedImage(null)}>
          <section
            aria-label="Generated image viewer"
            aria-modal="true"
            className={styles.imageViewer}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className={styles.imageViewerHeader}>
              <div>
                <strong>Generated image</strong>
                <p>{selectedImage.prompt}</p>
              </div>
              <div className={styles.imageViewerActions}>
                <a href={selectedImage.resultUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
                <button aria-label="Close image viewer" onClick={() => setSelectedImage(null)} type="button">
                  x
                </button>
              </div>
            </div>
            <div className={styles.imageViewerCanvas}>
              <img alt={selectedImage.prompt ?? "Generated image"} src={selectedImage.resultUrl} />
            </div>
          </section>
        </div>
      ) : null}

      <form
        className={styles.promptComposer}
        data-drop-active={isReferenceDropActive}
        onDragLeave={() => setIsReferenceDropActive(false)}
        onDragOver={handleReferenceDragOver}
        onDrop={handleReferenceDrop}
        onSubmit={handleGenerate}
      >
        {errorMessage ? <p className={styles.composerError}>{errorMessage}</p> : null}
        {referenceImages.length > 0 ? (
          <div className={styles.referenceStrip} aria-label="Reference images">
            {referenceImages.map((image) => (
              <div className={styles.referenceThumb} data-status={image.status} key={image.id}>
                {image.previewUrl ? <img alt={image.fileName} src={image.previewUrl} /> : <AppsIcon name="image" />}
                <span>{image.status === "uploading" ? "Uploading" : image.fileName}</span>
                {image.errorMessage ? <small>{image.errorMessage}</small> : null}
                <button aria-label={`Remove ${image.fileName}`} onClick={() => removeReferenceImage(image.id)} type="button">
                  x
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <div className={styles.composerPromptRow}>
          <input
            accept="image/jpeg,image/png,image/webp"
            className={styles.hiddenFileInput}
            multiple
            onChange={(event) => {
              void handleReferenceFiles(event.target.files);
              event.target.value = "";
            }}
            ref={fileInputRef}
            type="file"
          />
          <button
            aria-label="Add reference image"
            className={styles.addReferenceButton}
            disabled={referenceImages.length >= 8 || hasUploadingReferences}
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <span>+</span>
            Add
          </button>
          <label className={styles.promptComposerField}>
            <span>Image prompt</span>
            <textarea
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Describe the image you want to create..."
              rows={2}
              value={prompt}
            />
          </label>
        </div>
        <div className={styles.composerBottomRow}>
          <div className={styles.composerControls} aria-label="Quick settings">
            {settingControls.map((control) => (
              <div className={styles.settingControl} key={control.key}>
                <button
                  aria-expanded={openSetting === control.key}
                  aria-haspopup="listbox"
                  className={styles.settingButton}
                  onClick={() => setOpenSetting((currentKey) => (currentKey === control.key ? null : control.key))}
                  type="button"
                >
                  <span>{settings[control.key]}</span>
                  <small>{control.label}</small>
                </button>
                {openSetting === control.key ? (
                  <div className={styles.settingMenu} role="listbox" aria-label={control.label}>
                    {settingOptions[control.key].map((option) => (
                      <button
                        aria-selected={settings[control.key] === option}
                        className={settings[control.key] === option ? styles.settingOptionActive : ""}
                        key={option}
                        onClick={() => handleSettingSelect(control.key, option)}
                        role="option"
                        type="button"
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className={styles.composerActionGroup}>
            <button
              className={styles.generateButton}
              disabled={!prompt.trim() || isImageQueueFull || hasUploadingReferences}
              type="submit"
            >
              <AppsIcon className={styles.inlineIcon} compact name="spark" />
              {isImageQueueFull ? "Wait a moment" : isSubmitting ? "Creating..." : "Create image"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}
