import "server-only"

import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3"
import { Upload } from "@aws-sdk/lib-storage"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Readable } from "node:stream"
import { serverEnv } from "@/src/lib/env"

function getS3Client() {
  return new S3Client({
    region: serverEnv.SUPABASE_STORAGE_S3_REGION,
    endpoint: serverEnv.SUPABASE_STORAGE_S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: serverEnv.SUPABASE_STORAGE_S3_ACCESS_KEY_ID,
      secretAccessKey: serverEnv.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY,
    },
  })
}

export async function uploadStream(opts: {
  bucket: string
  key: string
  stream: Readable
  contentType: string
}) {
  const client = getS3Client()
  const upload = new Upload({
    client,
    params: {
      Bucket: opts.bucket,
      Key: opts.key,
      Body: opts.stream,
      ContentType: opts.contentType,
    },
  })
  const result = await upload.done()
  return {
    etag: typeof result.ETag === "string" ? result.ETag.replaceAll('"', "") : null,
  }
}

export async function headObject(opts: { bucket: string; key: string }) {
  const client = getS3Client()
  const res = await client.send(new HeadObjectCommand({ Bucket: opts.bucket, Key: opts.key }))
  return {
    contentType: res.ContentType ?? null,
    sizeBytes: typeof res.ContentLength === "number" ? BigInt(res.ContentLength) : null,
    etag: typeof res.ETag === "string" ? res.ETag.replaceAll('"', "") : null,
    lastModified: res.LastModified ?? null,
  }
}

export async function getSignedDownloadUrl(opts: { bucket: string; key: string; expiresSeconds: number }) {
  const client = getS3Client()
  return getSignedUrl(client, new GetObjectCommand({ Bucket: opts.bucket, Key: opts.key }), {
    expiresIn: opts.expiresSeconds,
  })
}

export async function getSignedUploadUrl(opts: { bucket: string; key: string; contentType: string; expiresSeconds: number }) {
  const client = getS3Client()
  return getSignedUrl(client, new PutObjectCommand({ Bucket: opts.bucket, Key: opts.key, ContentType: opts.contentType }), {
    expiresIn: opts.expiresSeconds,
  })
}

export async function downloadObjectToBuffer(opts: { bucket: string; key: string }) {
  const client = getS3Client()
  const res = await client.send(new GetObjectCommand({ Bucket: opts.bucket, Key: opts.key }))
  if (!res.Body) throw new Error("S3 GetObject returned empty body")
  const chunks: Buffer[] = []
  const stream = res.Body as unknown as Readable
  for await (const chunk of stream) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  return Buffer.concat(chunks)
}
