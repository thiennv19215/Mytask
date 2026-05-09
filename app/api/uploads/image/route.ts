import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { UploadImageFolder, UploadImageResponse } from "@/features/uploads/upload-types";

export const runtime = "nodejs";

const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const allowedFolders = new Set<UploadImageFolder>([
  "image-generator",
  "video-generator",
  "product-video",
  "media-library",
  "common"
]);

const extensionByType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

function jsonResponse(body: UploadImageResponse, status: number) {
  return Response.json(body, { status });
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing env ${name}`);
  }

  return value;
}

function getMaxSizeBytes() {
  const maxSizeMb = Number(process.env.UPLOAD_IMAGE_MAX_MB ?? "10");
  const safeMaxSizeMb = Number.isFinite(maxSizeMb) && maxSizeMb > 0 ? maxSizeMb : 10;
  return safeMaxSizeMb * 1024 * 1024;
}

function normalizeFolder(value: FormDataEntryValue | null): UploadImageFolder {
  const folder = typeof value === "string" ? value : "common";
  return allowedFolders.has(folder as UploadImageFolder) ? (folder as UploadImageFolder) : "common";
}

function buildObjectKey(folder: UploadImageFolder, contentType: string) {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const extension = extensionByType[contentType] ?? "bin";
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const uploadPrefix = (process.env.R2_UPLOAD_PREFIX ?? "uploads/images").replace(/^\/+|\/+$/g, "");

  return `${uploadPrefix}/${folder}/${year}/${month}/${day}/${Date.now()}-${random}.${extension}`;
}

function buildPublicUrl(publicBaseUrl: string, key: string) {
  return `${publicBaseUrl.replace(/\/+$/g, "")}/${key}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonResponse({ success: false, message: "Image file is required", asset: null }, 400);
    }

    if (!allowedImageTypes.has(file.type)) {
      return jsonResponse({ success: false, message: "Only JPEG, PNG, and WebP images are supported", asset: null }, 400);
    }

    if (file.size > getMaxSizeBytes()) {
      return jsonResponse({ success: false, message: "Image file is too large", asset: null }, 400);
    }

    const accountId = getRequiredEnv("R2_ACCOUNT_ID");
    const accessKeyId = getRequiredEnv("R2_ACCESS_KEY_ID");
    const secretAccessKey = getRequiredEnv("R2_SECRET_ACCESS_KEY");
    const bucketName = getRequiredEnv("R2_BUCKET_NAME");
    const publicBaseUrl = getRequiredEnv("R2_PUBLIC_BASE_URL");
    const folder = normalizeFolder(formData.get("folder"));
    const key = buildObjectKey(folder, file.type);
    const body = Buffer.from(await file.arrayBuffer());

    const s3Client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: body,
        ContentType: file.type,
        ContentLength: file.size
      })
    );

    return jsonResponse(
      {
        success: true,
        message: "Image uploaded",
        asset: {
          key,
          url: buildPublicUrl(publicBaseUrl, key),
          contentType: file.type,
          size: file.size,
          originalName: file.name
        }
      },
      200
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload image failed";
    return jsonResponse({ success: false, message, asset: null }, 500);
  }
}
