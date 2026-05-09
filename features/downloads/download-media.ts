"use client";

type DownloadMediaOptions = {
  fallbackFileName?: string;
  fileName?: string;
  url: string;
};

const contentTypeExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "video/mp4": "mp4",
  "video/mpeg": "mpeg",
  "video/quicktime": "mov",
  "video/webm": "webm"
};

function getExtensionFromUrl(url: string) {
  try {
    const pathName = new URL(url, window.location.href).pathname;
    const fileName = pathName.split("/").filter(Boolean).at(-1) ?? "";
    const extension = fileName.match(/\.([a-z0-9]{2,5})$/i)?.[1];

    return extension?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function getExtensionFromContentType(contentType: string) {
  const cleanContentType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";

  return contentTypeExtensions[cleanContentType] ?? "";
}

function hasExtension(fileName: string) {
  return /\.[a-z0-9]{2,5}$/i.test(fileName);
}

function sanitizeFileName(fileName: string) {
  return fileName.trim().replace(/[<>:"/\\|?*\u0000-\u001F]+/g, "-").replace(/\s+/g, " ");
}

function buildFileName(url: string, fileName: string | undefined, contentType: string) {
  const cleanBaseName = sanitizeFileName(fileName || "") || "download";

  if (hasExtension(cleanBaseName)) {
    return cleanBaseName;
  }

  const extension = getExtensionFromUrl(url) || getExtensionFromContentType(contentType);

  return extension ? `${cleanBaseName}.${extension}` : cleanBaseName;
}

function openDownloadFallback(url: string) {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function downloadMedia({ fallbackFileName, fileName, url }: DownloadMediaOptions) {
  const cleanUrl = url.trim();

  if (!cleanUrl) {
    return;
  }

  try {
    const response = await fetch(cleanUrl);

    if (!response.ok) {
      throw new Error(`Download request failed: ${response.status}`);
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = objectUrl;
    link.download = buildFileName(cleanUrl, fileName || fallbackFileName, blob.type || response.headers.get("content-type") || "");
    link.rel = "noreferrer";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
  } catch {
    openDownloadFallback(cleanUrl);
  }
}
