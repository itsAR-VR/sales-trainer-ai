import { NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "node:crypto"
import { requireOrgContext } from "@/src/lib/auth/context"
import { serverEnv } from "@/src/lib/env"
import { getSignedUploadUrl } from "@/src/lib/storage/s3"

export const runtime = "nodejs"

const bodySchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive().optional(),
})

function safeFilename(name: string) {
  const cleaned = name.replaceAll(/[^a-zA-Z0-9._-]/g, "_")
  return cleaned.slice(0, 140) || "upload"
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const uploadId = randomUUID()
  const filename = safeFilename(parsed.data.filename)
  const mimeType = parsed.data.mimeType || "application/octet-stream"

  const bucket = serverEnv.STORAGE_BUCKET_FRAMEWORK_UPLOADS
  const key = `org/${ctx.org.id}/frameworks/uploads/${uploadId}/${filename}`

  const url = await getSignedUploadUrl({ bucket, key, contentType: mimeType, expiresSeconds: 60 * 10 })
  return NextResponse.json({ data: { uploadId, bucket, key, filename, mimeType, url } })
}

