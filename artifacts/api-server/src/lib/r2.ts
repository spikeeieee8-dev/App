import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";

const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || "";
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || "";
const R2_BUCKET = process.env.R2_BUCKET_NAME || process.env.R2_BUCKET || "almera";
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || "";

let client: S3Client | null = null;

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      forcePathStyle: true,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID,
        secretAccessKey: R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

export function isR2Configured(): boolean {
  return !!(R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY);
}

export async function uploadToR2(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder = "products"
): Promise<string> {
  if (!isR2Configured()) {
    throw new Error("Cloudflare R2 is not configured. Set R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.");
  }
  const ext = path.extname(originalName) || ".jpg";
  const key = `${folder}/${randomUUID()}${ext}`;

  await getClient().send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicBase = R2_PUBLIC_URL || `https://${R2_BUCKET}.r2.dev`;
  return `${publicBase}/${key}`;
}
