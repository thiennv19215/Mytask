export type UploadImageFolder =
  | "image-generator"
  | "video-generator"
  | "product-video"
  | "media-library"
  | "common";

export type UploadImageOptions = {
  folder?: UploadImageFolder;
  maxSizeMb?: number;
};

export type UploadedAsset = {
  key: string;
  url: string;
  contentType: string;
  size: number;
  originalName: string;
};

export type UploadImageResponse = {
  success: boolean;
  message: string;
  asset: UploadedAsset | null;
};
