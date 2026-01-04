import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { serverEnv } from "@/src/lib/env"
import { downloadObjectToBuffer, headObject, uploadStream } from "@/src/lib/storage/s3"
import { Readable } from "node:stream"

export const runtime = "nodejs"
export const maxDuration = 60

const bodySchema = z.object({
  uploadId: z.string().uuid(),
  bucket: z.string().min(1),
  key: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
})

async function extractText(opts: { buffer: Buffer; filename: string; mimeType: string }) {
  const ext = opts.filename.toLowerCase().split(".").pop() ?? ""
  if (opts.mimeType === "text/markdown" || ext === "md") {
    return opts.buffer.toString("utf8")
  }
  if (opts.mimeType === "application/pdf" || ext === "pdf") {
    try {
      const pdfParse = (await import("pdf-parse")).default
      const res = await pdfParse(opts.buffer)
      return res.text || ""
    } catch {
      return ""
    }
  }
  if (opts.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") {
    try {
      const mammoth = await import("mammoth")
      const res = await mammoth.extractRawText({ buffer: opts.buffer })
      return res.value || ""
    } catch {
      return ""
    }
  }
  return ""
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  try {
    const parsed = bodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

    const { uploadId, bucket, key, filename, mimeType } = parsed.data
    if (bucket !== serverEnv.STORAGE_BUCKET_FRAMEWORK_UPLOADS) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid upload bucket" } }, { status: 400 })
    }
    if (!key.startsWith(`org/${ctx.org.id}/frameworks/uploads/${uploadId}/`)) {
      return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid upload key" } }, { status: 400 })
    }

    const head = await headObject({ bucket, key })
    const sizeBytes = head.sizeBytes ? Number(head.sizeBytes) : null

    await prisma.documentUpload
      .create({
        data: {
          id: uploadId,
          orgId: ctx.org.id,
          userId: ctx.user.id,
          bucket,
          path: key,
          filename,
          mimeType,
          sizeBytes: BigInt(sizeBytes ?? 0),
          status: "uploaded",
        },
      })
      .catch(async () => {
        await prisma.documentUpload.update({
          where: { id: uploadId },
          data: { bucket, path: key, filename, mimeType, sizeBytes: BigInt(sizeBytes ?? 0), status: "uploaded" },
        })
      })

    const buffer = await downloadObjectToBuffer({ bucket, key })
    const extracted = (await extractText({ buffer, filename, mimeType })).trim()
    if (!extracted) {
      await prisma.documentUpload.update({
        where: { id: uploadId },
        data: { status: "ocr_required" },
      })
      return NextResponse.json({ data: { extractionId: uploadId, ocrRequired: true } })
    }

    const extractedBucket = serverEnv.STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT
    const extractedKey = `org/${ctx.org.id}/frameworks/uploads/${uploadId}/extracted.txt`
    await uploadStream({
      bucket: extractedBucket,
      key: extractedKey,
      stream: Readable.from(extracted),
      contentType: "text/plain; charset=utf-8",
    })

    await prisma.documentUpload.update({
      where: { id: uploadId },
      data: { status: "extracted", extractedTextPath: extractedKey },
    })

    return NextResponse.json({ data: { extractionId: uploadId, ocrRequired: false } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: msg || "Request failed" } }, { status: 500 })
  }
}
