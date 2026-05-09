"use client";

import { useEffect } from "react";
import { startJobPolling } from "./polling-manager";
import { upsertGenerationJob } from "./generation-store";
import type { GenerationJob } from "./generation-types";

type GenerationHistoryType = "image" | "video";

type ListGenerationJobsOptions = {
  type?: GenerationHistoryType;
  limit?: number;
};

type ListGenerationResourcesOptions = {
  limit?: number;
};

export type GenjobRow = {
  id: string | null;
  job_type: string | null;
  prompt: string | null;
  aspect_ratio: string | null;
  input_images: unknown;
  status: string | null;
  task_id?: string | null;
  result_url: string | null;
  error_message: string | null;
  deleted_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type GenerationResourceItem = {
  id: string;
  type: "image" | "video";
  prompt: string | null;
  aspectRatio: string | null;
  url: string;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
};

const hydratedKeys = new Set<string>();
const inflightHydrations = new Map<string, Promise<void>>();
const activeHistoryStatuses = new Set(["queued", "processing", "progress"]);

function getHistoryKey(options?: ListGenerationJobsOptions) {
  return `${options?.type ?? "all"}:${options?.limit ?? 20}`;
}

function getSupabaseRestConfig() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "");
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return { supabaseUrl, supabaseAnonKey };
}

function normalizeInputImages(inputImages: unknown) {
  if (Array.isArray(inputImages)) {
    return inputImages.filter((item): item is string => typeof item === "string");
  }

  if (typeof inputImages === "string") {
    try {
      const parsed = JSON.parse(inputImages) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }

  return [];
}

export function mapGenjobRow(row: GenjobRow): GenerationJob {
  const jobType = row.job_type;
  const mediaType = jobType === "video" ? "video" : jobType === "image" ? "image" : null;

  return {
    id: row.id,
    type: jobType,
    prompt: row.prompt,
    status: row.status ?? "queued",
    aspectRatio: row.aspect_ratio ? String(row.aspect_ratio).toLowerCase() : null,
    inputImages: normalizeInputImages(row.input_images),
    mediaType,
    resultUrl: row.result_url,
    errorMessage: row.error_message
  };
}

export async function listGenerationJobs(options?: ListGenerationJobsOptions) {
  const config = getSupabaseRestConfig();

  if (!config) {
    return [];
  }

  const limit = options?.limit ?? 20;
  const params = new URLSearchParams({
    select: "id,job_type,prompt,aspect_ratio,input_images,status,task_id,result_url,error_message,created_at,updated_at,deleted_at",
    deleted_at: "is.null",
    order: "created_at.desc",
    limit: String(limit),
    apikey: config.supabaseAnonKey
  });

  if (options?.type) {
    params.set("job_type", `eq.${options.type}`);
  }

  const response = await fetch(`${config.supabaseUrl}/rest/v1/genjob?${params.toString()}`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load generation history (${response.status})`);
  }

  const rows = (await response.json()) as GenjobRow[];
  return rows.map(mapGenjobRow);
}

export async function listGenerationResources(options?: ListGenerationResourcesOptions) {
  const config = getSupabaseRestConfig();

  if (!config) {
    return [];
  }

  const params = new URLSearchParams({
    select: "id,job_type,prompt,aspect_ratio,result_url,created_at,updated_at,status,deleted_at",
    status: "eq.success",
    result_url: "not.is.null",
    deleted_at: "is.null",
    order: "created_at.desc",
    limit: String(options?.limit ?? 20),
    apikey: config.supabaseAnonKey
  });

  const response = await fetch(`${config.supabaseUrl}/rest/v1/genjob?${params.toString()}`, {
    headers: {
      apikey: config.supabaseAnonKey,
      Authorization: `Bearer ${config.supabaseAnonKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to load resources (${response.status})`);
  }

  const rows = (await response.json()) as GenjobRow[];

  return rows
    .filter((row) => row.id && row.result_url && (row.job_type === "image" || row.job_type === "video"))
    .map((row) => ({
      id: row.id as string,
      type: row.job_type as "image" | "video",
      prompt: row.prompt,
      aspectRatio: row.aspect_ratio ? String(row.aspect_ratio).toLowerCase() : null,
      url: row.result_url as string,
      createdAt: row.created_at ?? null,
      updatedAt: row.updated_at ?? null,
      deletedAt: row.deleted_at ?? null
    }));
}

export async function hydrateGenerationHistory(options?: ListGenerationJobsOptions) {
  const key = getHistoryKey(options);

  if (hydratedKeys.has(key)) {
    return;
  }

  const inflightHydration = inflightHydrations.get(key);

  if (inflightHydration) {
    return inflightHydration;
  }

  const hydration = listGenerationJobs(options)
    .then((jobs) => {
      for (const job of jobs) {
        upsertGenerationJob(job);
      }

      for (const job of jobs) {
        if (job.id && activeHistoryStatuses.has(String(job.status).toLowerCase())) {
          startJobPolling(job.id);
        }
      }

      hydratedKeys.add(key);
    })
    .catch((error) => {
      console.error(error);
    })
    .finally(() => {
      inflightHydrations.delete(key);
    });

  inflightHydrations.set(key, hydration);
  return hydration;
}

export function useHydrateGenerationHistory(type?: GenerationHistoryType, limit = 20) {
  useEffect(() => {
    void hydrateGenerationHistory({ type, limit });
  }, [type, limit]);
}
