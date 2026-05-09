"use client";

import { useSyncExternalStore } from "react";
import type { GenerationJob } from "./generation-types";

type GenerationState = {
  jobs: GenerationJob[];
};

const state: GenerationState = {
  jobs: []
};

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state.jobs;
}

function getServerSnapshot() {
  return state.jobs;
}

export function upsertGenerationJob(job: GenerationJob) {
  if (!job.id) {
    return;
  }

  const existingIndex = state.jobs.findIndex((item) => item.id === job.id);

  if (existingIndex >= 0) {
    state.jobs = state.jobs.map((item, index) => (index === existingIndex ? { ...item, ...job } : item));
  } else {
    state.jobs = [job, ...state.jobs];
  }

  emitChange();
}

export function useGenerationJobs(type?: string) {
  const jobs = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return type ? jobs.filter((job) => job.type === type) : jobs;
}
