export type GenerationAspectRatio = "portrait" | "landscape" | "square";

export type GenerationStatus = "queued" | "processing" | "progress" | "success" | "failed";

export type GenerationJobType = "image" | "video" | string;

export type CreateImagePayload = {
  type?: "image";
  prompt: string;
  aspectRatio: GenerationAspectRatio;
  images: string[];
};

export type CreateVideoPayload = {
  prompt: string;
  aspectRatio: GenerationAspectRatio;
  images: string[];
};

export type GenerationJob = {
  id: string | null;
  type: GenerationJobType | null;
  prompt: string | null;
  status: GenerationStatus | string;
  aspectRatio: GenerationAspectRatio | string | null;
  inputImages: string[];
  mediaType: "image" | "video" | null;
  resultUrl: string | null;
  errorMessage: string | null;
};

export type GenerationResponse = {
  success: boolean;
  message: string;
  job: GenerationJob | null;
};
