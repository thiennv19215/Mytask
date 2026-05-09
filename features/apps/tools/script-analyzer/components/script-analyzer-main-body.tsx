"use client";

import { useEffect, useMemo, useState } from "react";
import { AppsIcon } from "../../../components/apps-icons";
import { createImageJob, createVideoJob } from "@/features/generation/generation-api";
import { countActiveGenerationJobs, isGenerationActive } from "@/features/generation/generation-status";
import { upsertGenerationJob, useGenerationJobs } from "@/features/generation/generation-store";
import type { GenerationJob } from "@/features/generation/generation-types";
import { startJobPolling } from "@/features/generation/polling-manager";
import { uploadImage } from "@/features/uploads/upload-api";
import { getPayloadImageUrl, getPreviewImageUrl } from "@/features/uploads/upload-image-url";
import styles from "./script-analyzer-main-body.module.css";

const queueFullMessage = "Ban thao tac qua nhanh, vui long cho mot chut.";

type SceneStatus = "idle" | "creating" | "queued" | "processing" | "progress" | "success" | "failed";

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

type ScenarioSceneRow = {
  id: string;
  imagePrompt: string;
  referenceImages: ReferenceImage[];
  imageJobId?: string;
  imageStatus: SceneStatus;
  imageResultUrl?: string;
  imageErrorMessage?: string;
  imageDirty?: boolean;
  videoPrompt: string;
  videoJobId?: string;
  videoStatus: SceneStatus;
  videoResultUrl?: string;
  videoErrorMessage?: string;
};

const initialRows: ScenarioSceneRow[] = [
  {
    id: "scene-1",
    imagePrompt: "Vertical product shot, clean studio lighting, main visual reference, premium ecommerce style.",
    referenceImages: [],
    imageStatus: "idle",
    videoPrompt: "Slow push-in camera move, product reveal, clean light, social ad pacing.",
    videoStatus: "idle"
  },
  {
    id: "scene-2",
    imagePrompt: "Second vertical scene using the same product identity, show the main benefit in context.",
    referenceImages: [],
    imageStatus: "idle",
    videoPrompt: "Animate the benefit with a smooth before-after transition and soft camera movement.",
    videoStatus: "idle"
  }
];

function normalizeSceneStatus(status: string | null | undefined): SceneStatus {
  const normalizedStatus = String(status ?? "").toLowerCase();

  if (normalizedStatus === "success" || normalizedStatus === "failed") {
    return normalizedStatus;
  }

  if (isGenerationActive(normalizedStatus)) {
    return normalizedStatus as SceneStatus;
  }

  return "idle";
}

function getStatusLabel(status: SceneStatus) {
  if (status === "creating") return "Dang gui yeu cau...";
  if (status === "queued") return "Dang cho xu ly...";
  if (status === "processing" || status === "progress") return "Dang tao...";
  if (status === "failed") return "Failed";
  if (status === "success") return "Done";
  return "Ready";
}

function createEmptyScene(): ScenarioSceneRow {
  return {
    id: crypto.randomUUID(),
    imagePrompt: "",
    referenceImages: [],
    imageStatus: "idle",
    videoPrompt: "",
    videoStatus: "idle"
  };
}

function canUseSceneOneReference(sceneOne: ScenarioSceneRow | undefined) {
  return sceneOne?.imageStatus === "success" && Boolean(sceneOne.imageResultUrl);
}

function getStepState(status: SceneStatus, isEnabled = true) {
  if (!isEnabled) return "locked";
  if (status === "success") return "done";
  if (status === "failed") return "failed";
  if (isGenerationActive(status)) return "active";
  return "idle";
}

function getStepStateLabel(state: string) {
  if (state === "done") return "Done";
  if (state === "active") return "Running";
  if (state === "failed") return "Failed";
  if (state === "locked") return "Locked";
  return "Ready";
}

export function ScriptAnalyzerMainBody() {
  const [scriptDraft, setScriptDraft] = useState("");
  const [rows, setRows] = useState<ScenarioSceneRow[]>(initialRows);
  const [pendingSequentialRowIds, setPendingSequentialRowIds] = useState<string[]>([]);
  const imageJobs = useGenerationJobs("image");
  const videoJobs = useGenerationJobs("video");

  const imageJobsById = useMemo(() => new Map(imageJobs.map((job) => [job.id, job])), [imageJobs]);
  const videoJobsById = useMemo(() => new Map(videoJobs.map((job) => [job.id, job])), [videoJobs]);

  const resolvedRows = rows.map((row) => {
    const imageJob = row.imageJobId ? imageJobsById.get(row.imageJobId) : null;
    const videoJob = row.videoJobId ? videoJobsById.get(row.videoJobId) : null;

    return {
      ...row,
      imageStatus: imageJob ? normalizeSceneStatus(imageJob.status) : row.imageStatus,
      imageResultUrl: imageJob?.resultUrl ?? row.imageResultUrl,
      imageErrorMessage: imageJob?.errorMessage ?? row.imageErrorMessage,
      videoStatus: videoJob ? normalizeSceneStatus(videoJob.status) : row.videoStatus,
      videoResultUrl: videoJob?.resultUrl ?? row.videoResultUrl,
      videoErrorMessage: videoJob?.errorMessage ?? row.videoErrorMessage
    };
  });

  const sceneOne = resolvedRows[0];
  const hasSceneOneReference = canUseSceneOneReference(sceneOne);
  const successfulVideos = videoJobs.filter((job) => job.status === "success" && job.resultUrl);
  const localImageActiveRows = rows.filter((row) => !row.imageJobId && isGenerationActive(row.imageStatus));
  const localVideoActiveRows = rows.filter((row) => !row.videoJobId && isGenerationActive(row.videoStatus));
  const imageQueueCount = countActiveGenerationJobs([
    ...imageJobs,
    ...localImageActiveRows.map((row) => ({ status: row.imageStatus }))
  ]);
  const videoQueueCount = countActiveGenerationJobs([
    ...videoJobs,
    ...localVideoActiveRows.map((row) => ({ status: row.videoStatus }))
  ]);
  const isImageQueueFull = imageQueueCount >= 4;
  const isVideoQueueFull = videoQueueCount >= 4;

  useEffect(() => {
    for (const rowId of pendingSequentialRowIds) {
      const row = resolvedRows.find((item) => item.id === rowId);

      if (!row) {
        setPendingSequentialRowIds((items) => items.filter((item) => item !== rowId));
        continue;
      }

      if (row.imageStatus === "failed") {
        setPendingSequentialRowIds((items) => items.filter((item) => item !== rowId));
        continue;
      }

      if (row.imageStatus === "success" && row.imageResultUrl && !isGenerationActive(row.videoStatus)) {
        setPendingSequentialRowIds((items) => items.filter((item) => item !== rowId));
        void createVideoForRow(row);
      }
    }
  }, [pendingSequentialRowIds, resolvedRows]);

  function updateRow(rowId: string, patch: Partial<ScenarioSceneRow>) {
    setRows((items) => items.map((item) => (item.id === rowId ? { ...item, ...patch } : item)));
  }

  function addScene() {
    setRows((items) => [...items, createEmptyScene()]);
  }

  function removeScene(rowId: string) {
    setRows((items) => (items.length > 1 ? items.filter((item) => item.id !== rowId) : items));
    setPendingSequentialRowIds((items) => items.filter((item) => item !== rowId));
  }

  function buildRowsFromScript() {
    const nextRows = scriptDraft
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => ({
        ...createEmptyScene(),
        imagePrompt: `Vertical 9:16 storyboard image: ${line}`,
        videoPrompt: `Motion and camera direction for this scene: ${line}`
      }));

    if (nextRows.length) {
      setRows(nextRows);
    }
  }

  function markDependentScenesDirty(rowId: string) {
    const sceneOneId = rows[0]?.id;

    if (rowId !== sceneOneId) {
      return;
    }

    setRows((items) =>
      items.map((item, index) =>
        index > 0 && item.imageResultUrl
          ? {
              ...item,
              imageDirty: true
            }
          : item
      )
    );
  }

  async function handleReferenceFiles(rowId: string, files: FileList | null) {
    const row = rows.find((item) => item.id === rowId);
    const selectedFiles = Array.from(files ?? []);

    if (!row || !selectedFiles.length) {
      return;
    }

    const remainingSlots = Math.max(0, 8 - row.referenceImages.length);
    const filesToUpload = selectedFiles.slice(0, remainingSlots);

    if (!filesToUpload.length) {
      updateRow(rowId, { imageErrorMessage: "Moi canh chi toi da 8 anh tham chieu" });
      return;
    }

    for (const file of filesToUpload) {
      const referenceId = crypto.randomUUID();
      const uploadingReference: ReferenceImage = {
        id: referenceId,
        fileName: file.name,
        originalUrl: "",
        payloadUrl: "",
        previewUrl: "",
        key: "",
        status: "uploading"
      };

      setRows((items) =>
        items.map((item) =>
          item.id === rowId
            ? {
                ...item,
                referenceImages: [...item.referenceImages, uploadingReference]
              }
            : item
        )
      );

      try {
        const uploaded = await uploadImage(file, { folder: "image-generator" });

        if (!uploaded.success || !uploaded.asset) {
          throw new Error(uploaded.message || "Upload image failed");
        }

        const asset = uploaded.asset;

        setRows((items) =>
          items.map((item) =>
            item.id === rowId
              ? {
                  ...item,
                  referenceImages: item.referenceImages.map((reference) =>
                    reference.id === referenceId
                      ? {
                          ...reference,
                          originalUrl: asset.url,
                          payloadUrl: getPayloadImageUrl(asset.url),
                          previewUrl: getPreviewImageUrl(asset.url),
                          key: asset.key,
                          status: "ready"
                        }
                      : reference
                  )
                }
              : item
          )
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload image failed";

        setRows((items) =>
          items.map((item) =>
            item.id === rowId
              ? {
                  ...item,
                  referenceImages: item.referenceImages.map((reference) =>
                    reference.id === referenceId ? { ...reference, status: "failed", errorMessage: message } : reference
                  )
                }
              : item
          )
        );
      }
    }
  }

  function removeReference(rowId: string, referenceId: string) {
    setRows((items) =>
      items.map((item) =>
        item.id === rowId
          ? {
              ...item,
              referenceImages: item.referenceImages.filter((reference) => reference.id !== referenceId)
            }
          : item
      )
    );
  }

  function getImagePayloadUrls(row: ScenarioSceneRow, rowIndex: number) {
    const urls = row.referenceImages.filter((image) => image.status === "ready").map((image) => image.payloadUrl);

    if (rowIndex > 0 && sceneOne?.imageResultUrl) {
      urls.unshift(getPayloadImageUrl(sceneOne.imageResultUrl));
    }

    return urls;
  }

  async function createImageForRow(row: ScenarioSceneRow, rowIndex: number) {
    const prompt = row.imagePrompt.trim();

    if (!prompt || isImageQueueFull || row.referenceImages.some((image) => image.status === "uploading")) {
      return false;
    }

    if (rowIndex > 0 && !hasSceneOneReference) {
      updateRow(row.id, {
        imageErrorMessage: "Can tao thanh cong anh canh 1 truoc de lam reference chinh"
      });
      return false;
    }

    markDependentScenesDirty(row.id);
    updateRow(row.id, {
      imageStatus: "creating",
      imageErrorMessage: undefined,
      imageResultUrl: undefined,
      imageDirty: false,
      imageJobId: undefined
    });

    try {
      const response = await createImageJob({
        type: "image",
        prompt,
        aspectRatio: "portrait",
        images: getImagePayloadUrls(row, rowIndex)
      });

      if (!response.job?.id) {
        throw new Error(response.message || "Missing image job id");
      }

      upsertGenerationJob(response.job);
      updateRow(row.id, {
        imageJobId: response.job.id,
        imageStatus: normalizeSceneStatus(response.job.status)
      });
      startJobPolling(response.job.id);
      return true;
    } catch (error) {
      updateRow(row.id, {
        imageStatus: "failed",
        imageErrorMessage: error instanceof Error ? error.message : "Create image failed"
      });
      return false;
    }
  }

  async function createVideoForRow(row: ScenarioSceneRow) {
    const prompt = row.videoPrompt.trim();

    if (!prompt || isVideoQueueFull || row.imageStatus !== "success" || !row.imageResultUrl || isGenerationActive(row.videoStatus)) {
      return false;
    }

    updateRow(row.id, {
      videoStatus: "creating",
      videoErrorMessage: undefined,
      videoResultUrl: undefined,
      videoJobId: undefined
    });

    try {
      const response = await createVideoJob({
        prompt,
        aspectRatio: "portrait",
        images: [getPayloadImageUrl(row.imageResultUrl)]
      });

      if (!response.job?.id) {
        throw new Error(response.message || "Missing video job id");
      }

      upsertGenerationJob(response.job);
      updateRow(row.id, {
        videoJobId: response.job.id,
        videoStatus: normalizeSceneStatus(response.job.status)
      });
      startJobPolling(response.job.id);
      return true;
    } catch (error) {
      updateRow(row.id, {
        videoStatus: "failed",
        videoErrorMessage: error instanceof Error ? error.message : "Create video failed"
      });
      return false;
    }
  }

  async function handleSequential(row: ScenarioSceneRow, rowIndex: number) {
    if (pendingSequentialRowIds.includes(row.id) || isGenerationActive(row.imageStatus) || isGenerationActive(row.videoStatus)) {
      return;
    }

    if (row.imageStatus === "success" && row.imageResultUrl) {
      void createVideoForRow(row);
      return;
    }

    const started = await createImageForRow(row, rowIndex);

    if (started) {
      setPendingSequentialRowIds((items) => (items.includes(row.id) ? items : [...items, row.id]));
    }
  }

  return (
    <section className={styles.storyboardPage} aria-label="Storyboard generator">
      <section aria-label="Storyboard workspace" className={styles.storyboardModal}>
        <header className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>SCENES</p>
            <h2>{resolvedRows.length} canh dang lam viec</h2>
          </div>
          <div className={styles.modalHeaderActions}>
            <span className={isImageQueueFull ? styles.queueFull : ""}>Image queue {imageQueueCount}/4</span>
            <span className={isVideoQueueFull ? styles.queueFull : ""}>Video queue {videoQueueCount}/4</span>
            <button className={styles.secondaryButton} onClick={addScene} type="button">
              Them canh
            </button>
          </div>
        </header>

        <div className={styles.scriptBuilder}>
          <label className={styles.fieldGroup}>
            <span>Nhap kich ban nhanh</span>
            <textarea
              onChange={(event) => setScriptDraft(event.target.value)}
              placeholder="Moi dong tao thanh mot canh..."
              rows={3}
              value={scriptDraft}
            />
          </label>
          <button className={styles.secondaryButton} onClick={buildRowsFromScript} type="button">
            Tach thanh canh
          </button>
        </div>

        <div className={styles.sceneList} aria-label="Scenario scenes">
          {resolvedRows.map((row, index) => {
            const hasUploadingReferences = row.referenceImages.some((image) => image.status === "uploading");
            const needsSceneOne = index > 0 && !hasSceneOneReference;
            const canCreateImage =
              Boolean(row.imagePrompt.trim()) && !isImageQueueFull && !isGenerationActive(row.imageStatus) && !hasUploadingReferences && !needsSceneOne;
            const canCreateVideo =
              Boolean(row.videoPrompt.trim()) &&
              row.imageStatus === "success" &&
              Boolean(row.imageResultUrl) &&
              !isVideoQueueFull &&
              !isGenerationActive(row.videoStatus);
            const canRunSequential =
              Boolean(row.imagePrompt.trim()) &&
              Boolean(row.videoPrompt.trim()) &&
              !pendingSequentialRowIds.includes(row.id) &&
              !isGenerationActive(row.imageStatus) &&
              !isGenerationActive(row.videoStatus) &&
              !hasUploadingReferences &&
              !needsSceneOne;
            const imagePromptState = row.imagePrompt.trim() ? "done" : "idle";
            const imageResultState = getStepState(row.imageStatus);
            const videoPromptState = row.imageStatus === "success" ? (row.videoPrompt.trim() ? "done" : "idle") : "locked";
            const videoResultState = getStepState(row.videoStatus, row.imageStatus === "success");

            return (
              <article className={styles.sceneCard} data-dirty={row.imageDirty ? "true" : "false"} key={row.id}>
                <header className={styles.sceneCardHeader}>
                  <div className={styles.sceneHeaderMain}>
                    <div className={styles.sceneTitleGroup}>
                      <strong>Scene {index + 1}</strong>
                      {index === 0 ? <span>Main ref</span> : null}
                      {row.imageDirty ? <span>Outdated</span> : null}
                    </div>
                    <div className={styles.sceneProgress} aria-label={`Scene ${index + 1} progress`}>
                      {[imagePromptState, imageResultState, videoPromptState, videoResultState].map((state, stepIndex) => (
                        <span data-state={state} key={`${row.id}-${stepIndex}`}>
                          {stepIndex + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className={styles.rowActions}>
                    <button className={styles.primaryButton} disabled={!canCreateImage} onClick={() => void createImageForRow(row, index)} type="button">
                      Tao anh
                    </button>
                    <button className={styles.secondaryButton} disabled={!canCreateVideo} onClick={() => void createVideoForRow(row)} type="button">
                      Tao video
                    </button>
                    <button className={styles.secondaryButton} disabled={!canRunSequential} onClick={() => void handleSequential(row, index)} type="button">
                      Tao anh -&gt; video
                    </button>
                    {(isImageQueueFull || isVideoQueueFull) && <small>{queueFullMessage}</small>}
                  </div>
                  <button aria-label={`Remove scene ${index + 1}`} className={styles.iconButton} onClick={() => removeScene(row.id)} type="button">
                    x
                  </button>
                </header>

                <div className={styles.scenePipelineGrid}>
                  <section className={styles.pipelineCard} data-state={imagePromptState} data-step="input">
                    <StepHeader label="Image prompt" number={1} state={imagePromptState} />
                    <label className={styles.cellField}>
                      <textarea onChange={(event) => updateRow(row.id, { imagePrompt: event.target.value })} rows={3} value={row.imagePrompt} />
                      {needsSceneOne ? <small>Can tao anh canh 1 thanh cong truoc.</small> : null}
                      {row.imageDirty ? <small>Anh nay cu vi canh 1 da regenerate.</small> : null}
                    </label>

                    <ReferenceUploader
                      disabled={hasUploadingReferences}
                      onFiles={(files) => void handleReferenceFiles(row.id, files)}
                      onRemove={(referenceId) => removeReference(row.id, referenceId)}
                      references={row.referenceImages}
                    />
                  </section>

                  <section className={styles.pipelineCard} data-state={imageResultState} data-step="result">
                    <StepHeader label="Image result" number={2} state={imageResultState} />
                    <MediaResult errorMessage={row.imageErrorMessage} mediaType="image" resultUrl={row.imageResultUrl} status={row.imageStatus} />
                  </section>

                  <section className={styles.pipelineCard} data-state={videoPromptState} data-step="input">
                    <StepHeader label="Video prompt" number={3} state={videoPromptState} />
                    <label className={styles.cellField}>
                      <textarea
                        onChange={(event) => updateRow(row.id, { videoPrompt: event.target.value })}
                        placeholder="Motion, camera, action..."
                        rows={3}
                        value={row.videoPrompt}
                      />
                      {row.imageStatus !== "success" ? <small>Tao anh thanh cong truoc khi tao video.</small> : null}
                    </label>
                  </section>

                  <section className={styles.pipelineCard} data-state={videoResultState} data-step="result">
                    <StepHeader label="Video result" number={4} state={videoResultState} />
                    <MediaResult errorMessage={row.videoErrorMessage} mediaType="video" resultUrl={row.videoResultUrl} status={row.videoStatus} />
                  </section>
                </div>
              </article>
            );
          })}
          <VideoResultsPanel videos={successfulVideos} />
        </div>
      </section>
    </section>
  );
}

function VideoResultsPanel({ videos }: { videos: GenerationJob[] }) {
  return (
    <section className={styles.videoResultsPanel} aria-label="Generated videos">
      <div className={styles.videoResultsHeader}>
        <div>
          <p className={styles.eyebrow}>VIDEO DA TAO</p>
          <h3>{videos.length} video thanh cong</h3>
        </div>
      </div>
      {videos.length ? (
        <div className={styles.videoResultStrip}>
          {videos.map((video) => (
            <article className={styles.videoResultCompactCard} key={video.id}>
              <video controls src={video.resultUrl ?? ""} />
              <div>
                <strong>{video.prompt ?? "Generated video"}</strong>
                <div className={styles.videoActions}>
                  <a href={video.resultUrl ?? ""} rel="noreferrer" target="_blank">
                    Open
                  </a>
                  <a download href={video.resultUrl ?? ""} rel="noreferrer" target="_blank">
                    Download
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.emptyVideoInline}>
          <AppsIcon name="video" />
          <span>Video success co resultUrl se hien tai day.</span>
        </div>
      )}
    </section>
  );
}

function StepHeader({ label, number, state }: { label: string; number: number; state: string }) {
  return (
    <div className={styles.stepHeader}>
      <span className={styles.stepNumber}>{number}</span>
      <strong>{label}</strong>
      <em data-state={state}>{getStepStateLabel(state)}</em>
    </div>
  );
}

function ReferenceUploader({
  disabled,
  onFiles,
  onRemove,
  references
}: {
  disabled: boolean;
  onFiles: (files: FileList | null) => void;
  onRemove: (referenceId: string) => void;
  references: ReferenceImage[];
}) {
  return (
    <div className={styles.referencesCell}>
      <label className={styles.referenceUploadButton}>
        <input
          accept="image/jpeg,image/png,image/webp"
          disabled={disabled || references.length >= 8}
          multiple
          onChange={(event) => {
            onFiles(event.target.files);
            event.target.value = "";
          }}
          type="file"
        />
        <span>Add reference</span>
      </label>
      <div className={styles.referenceList}>
        {references.length ? (
          references.map((reference) => (
            <div className={styles.referenceThumb} data-status={reference.status} key={reference.id}>
              {reference.previewUrl ? <img alt={reference.fileName} src={reference.previewUrl} /> : <AppsIcon name="image" />}
              <span>{reference.status === "uploading" ? "Uploading" : reference.fileName}</span>
              {reference.errorMessage ? <small>{reference.errorMessage}</small> : null}
              <button aria-label={`Remove ${reference.fileName}`} onClick={() => onRemove(reference.id)} type="button">
                x
              </button>
            </div>
          ))
        ) : (
          <p>No references</p>
        )}
      </div>
      <small>{references.length}/8 references</small>
    </div>
  );
}

function MediaResult({
  errorMessage,
  mediaType,
  resultUrl,
  status
}: {
  errorMessage?: string;
  mediaType: "image" | "video";
  resultUrl?: string;
  status: SceneStatus;
}) {
  const isPending = isGenerationActive(status);
  const isFailed = status === "failed";
  const isSuccess = status === "success" && Boolean(resultUrl);

  return (
    <div className={styles.mediaCell} data-status={status}>
      {isSuccess && mediaType === "image" ? <img alt="Generated scene" src={resultUrl} /> : null}
      {isSuccess && mediaType === "video" ? <video controls src={resultUrl} /> : null}
      {isPending ? (
        <div className={styles.mediaLoading} role="status">
          <span />
          <strong>{getStatusLabel(status)}</strong>
        </div>
      ) : null}
      {isFailed ? (
        <div className={styles.mediaError}>
          <strong>Failed</strong>
          <span>{errorMessage ?? "Generation failed"}</span>
        </div>
      ) : null}
      {!isPending && !isFailed && !isSuccess ? (
        <div className={styles.mediaEmpty}>
          <AppsIcon name={mediaType} />
          <span>{mediaType === "image" ? "No image" : "No video"}</span>
        </div>
      ) : null}
      {isSuccess && resultUrl ? (
        <a className={styles.openMediaLink} href={resultUrl} rel="noreferrer" target="_blank">
          Open
        </a>
      ) : null}
    </div>
  );
}
