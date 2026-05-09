type ResizeFormat = "auto" | "webp" | "avif";

type ResizeImageOptions = {
  width?: number;
  quality?: number;
  format?: ResizeFormat;
};

export function getResizedImageUrl(url: string, options?: ResizeImageOptions) {
  try {
    const parsed = new URL(url);
    const width = options?.width ?? 768;
    const quality = options?.quality ?? 72;
    const format = options?.format ?? "auto";

    return `${parsed.origin}/cdn-cgi/image/width=${width},quality=${quality},format=${format}${parsed.pathname}${parsed.search}`;
  } catch {
    return url;
  }
}

export function getPayloadImageUrl(url: string) {
  return getResizedImageUrl(url, {
    width: 768,
    quality: 72,
    format: "auto"
  });
}

export function getPreviewImageUrl(url: string) {
  return getResizedImageUrl(url, {
    width: 160,
    quality: 72,
    format: "auto"
  });
}
