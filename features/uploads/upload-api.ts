import type { UploadImageOptions, UploadImageResponse } from "./upload-types";
import { validateImageFile } from "./upload-validators";

export async function uploadImage(file: File, options?: UploadImageOptions) {
  validateImageFile(file, options);

  const formData = new FormData();
  formData.append("file", file);

  if (options?.folder) {
    formData.append("folder", options.folder);
  }

  const response = await fetch("/api/uploads/image", {
    method: "POST",
    body: formData
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Upload image failed");
  }

  return data as UploadImageResponse;
}
