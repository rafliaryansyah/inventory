// Cloudflare R2 (S3-compatible) storage helper.
//
// Used for uploaded resources / generated Delivery Note PDFs. R2 credentials
// are optional — when unset, the helper reports `isStorageConfigured() === false`
// and upload calls throw a clear, catchable error so the app degrades gracefully.

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET || "assetflow";
const PUBLIC_URL = process.env.R2_PUBLIC_URL?.replace(/\/$/, "") || "";

export function isStorageConfigured(): boolean {
  return Boolean(ACCOUNT_ID && ACCESS_KEY_ID && SECRET_ACCESS_KEY);
}

let _client: S3Client | null = null;
function client(): S3Client {
  if (!isStorageConfigured()) {
    throw new Error(
      "Penyimpanan file (R2) belum dikonfigurasi. Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, dan R2_SECRET_ACCESS_KEY.",
    );
  }
  if (!_client) {
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: ACCESS_KEY_ID!,
        secretAccessKey: SECRET_ACCESS_KEY!,
      },
    });
  }
  return _client;
}

export type UploadResult = { key: string; url: string };

/** Upload bytes to R2. Returns the object key and a usable URL. */
export async function uploadObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string,
): Promise<UploadResult> {
  await client().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
  return { key, url: await urlFor(key) };
}

/** Public URL when R2_PUBLIC_URL is set, otherwise a 1-hour presigned URL. */
export async function urlFor(key: string, expiresIn = 3600): Promise<string> {
  if (PUBLIC_URL) return `${PUBLIC_URL}/${key}`;
  return getSignedUrl(
    client(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn },
  );
}

export async function deleteObject(key: string): Promise<void> {
  await client().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}

/** Build a namespaced, collision-resistant object key. */
export function buildKey(folder: string, filename: string): string {
  const stamp = Date.now().toString(36);
  const rand = Math.round(Math.random() * 1e9).toString(36);
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${folder}/${stamp}-${rand}-${safe}`;
}
