import type { UploadImageOptions } from "./upload-types";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const defaultMaxSizeMb = 10;

export function validateImageFile(file: File, options?: UploadImageOptions) {
  if (!file) {
    throw new Error("Image file is required");
  }

  if (!allowedImageTypes.has(file.type)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported");
  }

  const maxSizeMb = options?.maxSizeMb ?? defaultMaxSizeMb;
  const maxSizeBytes = maxSizeMb * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    throw new Error(`Image must be ${maxSizeMb}MB or smaller`);
  }
}
