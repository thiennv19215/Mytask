"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AppsIcon } from "../../../components/apps-icons";
import { createImageJob, createVideoJob } from "@/features/generation/generation-api";
import { useHydrateGenerationHistory } from "@/features/generation/generation-history";
import { isGenerationActive } from "@/features/generation/generation-status";
import { upsertGenerationJob, useGenerationJobs } from "@/features/generation/generation-store";
import type { GenerationJob } from "@/features/generation/generation-types";
import { startJobPolling } from "@/features/generation/polling-manager";
import { uploadImage } from "@/features/uploads/upload-api";
import { getPayloadImageUrl, getPreviewImageUrl } from "@/features/uploads/upload-image-url";
import styles from "./script-analyzer-main-body.module.css";

const batchRetryLimit = 2;

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
  sourceSceneId?: string;
  title?: string;
  subtitle?: string;
  timingRange?: string;
  voiceover?: string;
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

type ProductionSceneInput = {
  scene_id?: number | string;
  title?: string;
  subtitle?: string;
  timing_range?: string;
  voiceover_vn?: string;
  banana_2_image_prompt?: string;
  image_prompt?: string;
  motion_instruction?: string;
  video_prompt?: string;
};

const initialRows: ScenarioSceneRow[] = [];

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

function asCleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getSceneSortValue(scene: ProductionSceneInput, index: number) {
  const sceneId = Number(scene.scene_id);
  return Number.isFinite(sceneId) ? sceneId : index + 1_000_000;
}

function buildVideoPromptFromJsonScene(scene: ProductionSceneInput) {
  const voiceover = asCleanString(scene.voiceover_vn);
  const motion = asCleanString(scene.motion_instruction);

  if (voiceover && motion) {
    return `Voiceover:\n${voiceover}\n\nMotion:\n${motion}`;
  }

  return motion || asCleanString(scene.video_prompt) || voiceover;
}

function mapProductionSceneToRow(scene: ProductionSceneInput): ScenarioSceneRow {
  const title = asCleanString(scene.title);
  const subtitle = asCleanString(scene.subtitle);
  const voiceover = asCleanString(scene.voiceover_vn);
  const fallbackImagePrompt = [title, subtitle, voiceover].filter(Boolean).join("\n");

  return {
    ...createEmptyScene(),
    sourceSceneId: scene.scene_id === undefined || scene.scene_id === null ? undefined : String(scene.scene_id),
    title: title || undefined,
    subtitle: subtitle || undefined,
    timingRange: asCleanString(scene.timing_range) || undefined,
    voiceover: voiceover || undefined,
    imagePrompt: asCleanString(scene.banana_2_image_prompt) || asCleanString(scene.image_prompt) || fallbackImagePrompt,
    videoPrompt: buildVideoPromptFromJsonScene(scene)
  };
}

function buildRowsFromPlainText(text: string) {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({
      ...createEmptyScene(),
      imagePrompt: line,
      videoPrompt: `Motion and camera direction for this scene: ${line}`
    }));
}

function buildRowsFromProductionJson(text: string) {
  const parsed = JSON.parse(text) as { production_data?: unknown };

  if (!Array.isArray(parsed.production_data)) {
    throw new Error("JSON thieu production_data");
  }

  const rows = (parsed.production_data as ProductionSceneInput[])
    .map((scene, index) => ({ scene, index }))
    .sort((a, b) => getSceneSortValue(a.scene, a.index) - getSceneSortValue(b.scene, b.index))
    .map(({ scene }) => mapProductionSceneToRow(scene))
    .filter((row) => row.imagePrompt.trim() || row.videoPrompt.trim());

  if (!rows.length) {
    throw new Error("Khong tim thay prompt trong JSON");
  }

  return rows;
}

function canUseSceneOneReference(sceneOne: ScenarioSceneRow | undefined) {
  return sceneOne?.imageStatus === "success" && Boolean(sceneOne.imageResultUrl);
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function ScriptAnalyzerMainBody() {
  useHydrateGenerationHistory();

  const [scriptDraft, setScriptDraft] = useState("");
  const [scriptErrorMessage, setScriptErrorMessage] = useState("");
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [rows, setRows] = useState<ScenarioSceneRow[]>(initialRows);
  const [pendingSequentialRowIds, setPendingSequentialRowIds] = useState<string[]>([]);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchActiveSceneIds, setBatchActiveSceneIds] = useState<string[]>([]);
  const resolvedRowsRef = useRef<ScenarioSceneRow[]>([]);
  const batchRunningRef = useRef(false);
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
  const canRunAllScenes =
    !isBatchRunning &&
    resolvedRows.some((row) => row.imagePrompt.trim()) &&
    !resolvedRows.some((row) => row.referenceImages.some((image) => image.status === "uploading"));

  useEffect(() => {
    resolvedRowsRef.current = resolvedRows;
  }, [resolvedRows]);

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
    setRows((items) => items.filter((item) => item.id !== rowId));
    setPendingSequentialRowIds((items) => items.filter((item) => item !== rowId));
  }

  function buildRowsFromScript() {
    const input = scriptDraft.trim();

    if (!input) {
      setScriptErrorMessage("Nhap text hoac JSON truoc khi tach canh");
      return;
    }

    let nextRows: ScenarioSceneRow[];

    try {
      nextRows = input.startsWith("{") || input.startsWith("[") ? buildRowsFromProductionJson(input) : buildRowsFromPlainText(input);
    } catch (error) {
      if (input.startsWith("{") || input.startsWith("[")) {
        setScriptErrorMessage(error instanceof Error ? error.message : "JSON khong hop le");
        return;
      }

      nextRows = buildRowsFromPlainText(input);
    }

    if (nextRows.length) {
      setRows((items) => [...items, ...nextRows]);
      setScriptDraft("");
      setScriptErrorMessage("");
      setIsScriptModalOpen(false);
    }
  }

  function markDependentScenesDirty(rowId: string) {
    const resolvedRows = resolvedRowsRef.current;
    const sceneOneId = resolvedRows[0]?.id;

    if (rowId !== sceneOneId) {
      return;
    }

    const dirtyRowIds = new Set(resolvedRows.filter((item, index) => index > 0 && item.imageResultUrl).map((item) => item.id));

    setRows((items) =>
      items.map((item) =>
        dirtyRowIds.has(item.id)
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
    const currentSceneOne = resolvedRowsRef.current[0] ?? sceneOne;

    if (rowIndex > 0 && currentSceneOne?.imageResultUrl) {
      urls.unshift(getPayloadImageUrl(currentSceneOne.imageResultUrl));
    }

    return urls;
  }

  async function createImageForRow(row: ScenarioSceneRow, rowIndex: number) {
    const prompt = row.imagePrompt.trim();

    if (!prompt || row.referenceImages.some((image) => image.status === "uploading") || isGenerationActive(row.imageStatus)) {
      return false;
    }

    if (rowIndex > 0 && !canUseSceneOneReference(resolvedRowsRef.current[0] ?? sceneOne)) {
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

    if (!prompt || row.imageStatus !== "success" || !row.imageResultUrl || isGenerationActive(row.videoStatus)) {
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

  function getCurrentRow(rowId: string) {
    return resolvedRowsRef.current.find((row) => row.id === rowId);
  }

  async function waitForImageDone(rowId: string) {
    while (batchRunningRef.current) {
      const row = getCurrentRow(rowId);

      if (!row) {
        throw new Error("Scene khong con ton tai");
      }

      if (row.imageStatus === "success" && row.imageResultUrl) {
        return row;
      }

      if (row.imageStatus === "failed") {
        throw new Error(row.imageErrorMessage || "Create image failed");
      }

      await wait(800);
    }

    throw new Error("Batch stopped");
  }

  async function createSceneOneImageForBatch() {
    const firstRow = resolvedRowsRef.current[0];

    if (!firstRow?.imagePrompt.trim()) {
      throw new Error("Scene 1 can co Image prompt");
    }

    for (let retry = 0; retry <= batchRetryLimit; retry += 1) {
      const latestRow = getCurrentRow(firstRow.id);

      if (!latestRow) {
        throw new Error("Scene 1 khong con ton tai");
      }

      if (latestRow.imageStatus === "success" && latestRow.imageResultUrl) {
        return latestRow;
      }

      if (!isGenerationActive(latestRow.imageStatus)) {
        setBatchActiveSceneIds([latestRow.id]);

        const started = await createImageForRow(latestRow, 0);

        if (!started) {
          throw new Error(latestRow.imageErrorMessage || "Khong the tao anh Scene 1");
        }
      }

      try {
        return await waitForImageDone(latestRow.id);
      } catch (error) {
        if (retry >= batchRetryLimit) {
          throw error;
        }
      }
    }

    throw new Error("Scene 1 image failed");
  }

  async function handleRunAllScenes() {
    if (batchRunningRef.current || !canRunAllScenes) {
      return;
    }

    batchRunningRef.current = true;
    setIsBatchRunning(true);
    setBatchActiveSceneIds([]);

    const imageRetryCounts = new Map<string, number>();
    const skippedImageRowIds = new Set<string>();
    const completedVideoRowIds = new Set<string>();

    try {
      await createSceneOneImageForBatch();

      while (batchRunningRef.current) {
        const currentRows = resolvedRowsRef.current.filter((row) => row.imagePrompt.trim());
        for (const row of currentRows) {
          const retryCount = imageRetryCounts.get(row.id) ?? 0;

          if (row.imageStatus === "failed") {
            if (retryCount < batchRetryLimit) {
              imageRetryCounts.set(row.id, retryCount + 1);
              skippedImageRowIds.delete(row.id);
            } else {
              skippedImageRowIds.add(row.id);
            }
          }

          if (
            !skippedImageRowIds.has(row.id) &&
            row.imageStatus !== "success" &&
            !isGenerationActive(row.imageStatus)
          ) {
            const rowIndex = currentRows.findIndex((item) => item.id === row.id);

            setBatchActiveSceneIds([row.id]);
            await createImageForRow(row, rowIndex);
          }
        }

        for (const row of currentRows) {
          const rowIndex = currentRows.findIndex((item) => item.id === row.id);

          if (row.imageStatus === "success" && row.imageResultUrl && !row.videoPrompt.trim()) {
            completedVideoRowIds.add(row.id);
          }

          if (row.videoStatus === "success" || row.videoStatus === "failed") {
            completedVideoRowIds.add(row.id);
          }

          if (
            row.imageStatus === "success" &&
            row.imageResultUrl &&
            row.videoPrompt.trim() &&
            row.videoStatus !== "success" &&
            !isGenerationActive(row.videoStatus)
          ) {
            setBatchActiveSceneIds([row.id]);
            await createVideoForRow(row);
          }
        }

        const currentRowsAfterWork = resolvedRowsRef.current.filter((row) => row.imagePrompt.trim());
        const imageDone = currentRowsAfterWork.every(
          (row) => (row.imageStatus === "success" && row.imageResultUrl) || skippedImageRowIds.has(row.id)
        );
        const videoDone = currentRowsAfterWork.every((row) => skippedImageRowIds.has(row.id) || completedVideoRowIds.has(row.id));

        if (imageDone && videoDone) {
          break;
        }

        await wait(900);
      }
    } catch (error) {
      console.error(error instanceof Error ? error.message : "Tao tat ca phan canh bi loi");
    } finally {
      batchRunningRef.current = false;
      setIsBatchRunning(false);
      setBatchActiveSceneIds([]);
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
        <header className={styles.storyboardHeader}>
          <button className={styles.secondaryButton} onClick={() => setIsScriptModalOpen(true)} type="button">
            Nhap kich ban
          </button>
          <button className={styles.primaryButton} disabled={!canRunAllScenes} onClick={() => void handleRunAllScenes()} type="button">
            {isBatchRunning ? "Dang tao..." : "Tao tat ca"}
          </button>
          <button className={styles.secondaryButton} onClick={addScene} type="button">
            Them canh
          </button>
        </header>

        <div className={styles.storyboardTable} aria-label="Scenario scenes">
          {resolvedRows.length ? (
            <div className={styles.storyboardRows}>
              {resolvedRows.map((row, index) => {
              const hasUploadingReferences = row.referenceImages.some((image) => image.status === "uploading");
              const needsSceneOne = index > 0 && !hasSceneOneReference;
              const isRowRunning = isGenerationActive(row.imageStatus) || isGenerationActive(row.videoStatus) || batchActiveSceneIds.includes(row.id);
              const canCreateImage = Boolean(row.imagePrompt.trim()) && !isGenerationActive(row.imageStatus) && !hasUploadingReferences && !needsSceneOne;
              const canRunSequential =
                Boolean(row.imagePrompt.trim()) &&
                Boolean(row.videoPrompt.trim()) &&
                !pendingSequentialRowIds.includes(row.id) &&
                !isGenerationActive(row.imageStatus) &&
                !isGenerationActive(row.videoStatus) &&
                !hasUploadingReferences &&
                !needsSceneOne;

              return (
                <article
                  className={styles.storyboardRow}
                  data-batch-active={batchActiveSceneIds.includes(row.id) ? "true" : "false"}
                  data-dirty={row.imageDirty ? "true" : "false"}
                  key={row.id}
                >
                  <header className={styles.sceneStripHeader}>
                    <div className={styles.sceneCell}>
                      <strong>{row.sourceSceneId ? `S${row.sourceSceneId}` : `S${index + 1}`}</strong>
                      {index === 0 ? <span>Main ref</span> : <span>Ref S1</span>}
                      {row.imageDirty ? <em>Outdated</em> : null}
                      {row.timingRange ? <small>{row.timingRange}</small> : null}
                      {row.title ? <small>{row.title}</small> : null}
                    </div>
                    <div className={styles.rowActions}>
                      <button className={styles.primaryButton} disabled={isRowRunning || !canCreateImage} onClick={() => void createImageForRow(row, index)} type="button">
                        Tao anh
                      </button>
                      <button className={styles.secondaryButton} disabled={isRowRunning || !canRunSequential} onClick={() => void handleSequential(row, index)} type="button">
                        Anh -&gt; video
                      </button>
                      <button aria-label={`Remove scene ${index + 1}`} className={styles.iconButton} onClick={() => removeScene(row.id)} type="button">
                        x
                      </button>
                    </div>
                  </header>

                  <div className={styles.sceneBlocks}>
                    <section className={styles.promptCell} aria-label={`Scene ${index + 1} image prompt`}>
                      <span className={styles.blockTitle}>Image prompt</span>
                      <textarea onChange={(event) => updateRow(row.id, { imagePrompt: event.target.value })} rows={5} value={row.imagePrompt} />
                      {needsSceneOne ? <small>Can tao anh Scene 1 thanh cong truoc.</small> : null}
                      {row.imageDirty ? <small>Anh nay cu vi Scene 1 da regenerate.</small> : null}
                      <ReferenceUploader
                        disabled={hasUploadingReferences}
                        compact
                        onFiles={(files) => void handleReferenceFiles(row.id, files)}
                        onRemove={(referenceId) => removeReference(row.id, referenceId)}
                        references={row.referenceImages}
                      />
                    </section>

                    <section className={styles.resultBlock} aria-label={`Scene ${index + 1} image result`}>
                      <span className={styles.blockTitle}>Image result</span>
                      <MediaResult errorMessage={row.imageErrorMessage} mediaType="image" resultUrl={row.imageResultUrl} status={row.imageStatus} />
                    </section>

                    <section className={styles.promptCell} aria-label={`Scene ${index + 1} video prompt`}>
                      <span className={styles.blockTitle}>Video prompt</span>
                      <textarea
                        onChange={(event) => updateRow(row.id, { videoPrompt: event.target.value })}
                        placeholder="Motion, camera, action..."
                        rows={5}
                        value={row.videoPrompt}
                      />
                    </section>

                    <section className={styles.resultBlock} aria-label={`Scene ${index + 1} video result`}>
                      <span className={styles.blockTitle}>Video result</span>
                      <MediaResult errorMessage={row.videoErrorMessage} mediaType="video" resultUrl={row.videoResultUrl} status={row.videoStatus} />
                    </section>
                  </div>
                </article>
              );
              })}
            </div>
          ) : (
            <section className={styles.emptyStoryboard} aria-label="Empty storyboard">
              <div className={styles.emptyStoryboardIcon}>
                <AppsIcon name="file" />
              </div>
              <div>
                <p className={styles.eyebrow}>STORYBOARD</p>
                <h2>Chua co canh nao</h2>
                <p>Nhap kich ban de tao nhieu canh, hoac them mot canh trong bang.</p>
              </div>
              <div className={styles.emptyStoryboardActions}>
                <button className={styles.primaryButton} onClick={() => setIsScriptModalOpen(true)} type="button">
                  Nhap kich ban
                </button>
                <button className={styles.secondaryButton} onClick={addScene} type="button">
                  Them canh
                </button>
              </div>
            </section>
          )}
          {resolvedRows.length || successfulVideos.length ? <VideoResultsPanel videos={successfulVideos} /> : null}
        </div>
      </section>

      {isScriptModalOpen ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setIsScriptModalOpen(false)}>
          <section aria-label="Nhap kich ban" aria-modal="true" className={styles.scriptModal} onClick={(event) => event.stopPropagation()} role="dialog">
            <header className={styles.scriptModalHeader}>
              <div>
                <p className={styles.eyebrow}>SCRIPT</p>
                <h2>Nhap kich ban</h2>
              </div>
              <button aria-label="Close script modal" className={styles.iconButton} onClick={() => setIsScriptModalOpen(false)} type="button">
                x
              </button>
            </header>
            <label className={styles.scriptModalField}>
              <span>Dan kich ban moi dong mot canh, hoac dan JSON co production_data</span>
              <textarea
                onChange={(event) => setScriptDraft(event.target.value)}
                placeholder={"Scene 1...\nScene 2...\n\nHoac JSON:\n{\n  \"production_data\": [\n    {\n      \"scene_id\": 1,\n      \"banana_2_image_prompt\": \"...\",\n      \"voiceover_vn\": \"...\",\n      \"motion_instruction\": \"...\"\n    }\n  ]\n}"}
                rows={10}
                value={scriptDraft}
              />
            </label>
            {scriptErrorMessage ? <p className={styles.scriptError}>{scriptErrorMessage}</p> : null}
            <div className={styles.scriptModalActions}>
              <button className={styles.secondaryButton} onClick={() => setIsScriptModalOpen(false)} type="button">
                Huy
              </button>
              <button className={styles.primaryButton} onClick={buildRowsFromScript} type="button">
                Tach thanh canh
              </button>
            </div>
          </section>
        </div>
      ) : null}
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

function ReferenceUploader({
  compact = false,
  disabled,
  onFiles,
  onRemove,
  references
}: {
  compact?: boolean;
  disabled: boolean;
  onFiles: (files: FileList | null) => void;
  onRemove: (referenceId: string) => void;
  references: ReferenceImage[];
}) {
  return (
    <div className={styles.referencesCell} data-compact={compact ? "true" : "false"}>
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
      {references.length ? (
        <div className={styles.referenceList}>
          {references.map((reference) => (
            <div className={styles.referenceThumb} data-status={reference.status} key={reference.id}>
              {reference.previewUrl ? <img alt={reference.fileName} src={reference.previewUrl} /> : <AppsIcon name="image" />}
              <span>{reference.status === "uploading" ? "Uploading" : reference.fileName}</span>
              {reference.errorMessage ? <small>{reference.errorMessage}</small> : null}
              <button aria-label={`Remove ${reference.fileName}`} onClick={() => onRemove(reference.id)} type="button">
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}
      {references.length ? <small>{references.length}/8 refs</small> : null}
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
