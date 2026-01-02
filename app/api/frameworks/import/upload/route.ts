import { NextResponse } from "next/server"
import { Readable } from "node:stream"
import { randomUUID } from "node:crypto"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { serverEnv } from "@/src/lib/env"
import { uploadStream } from "@/src/lib/storage/s3"

function safeFilename(name: string) {
  const cleaned = name.replaceAll(/[^a-zA-Z0-9._-]/g, "_")
  return cleaned.slice(0, 140) || "upload"
}

async function extractText(opts: { buffer: Buffer; filename: string; mimeType: string }) {
  const ext = opts.filename.toLowerCase().split(".").pop() ?? ""
  if (opts.mimeType === "text/markdown" || ext === "md") {
    return opts.buffer.toString("utf8")
  }
  if (opts.mimeType === "application/pdf" || ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default
    const res = await pdfParse(opts.buffer)
    return res.text || ""
  }
  if (
    opts.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const mammoth = await import("mammoth")
    const res = await mammoth.extractRawText({ buffer: opts.buffer })
    return res.value || ""
  }
  return ""
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const form = await request.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Missing file" } }, { status: 400 })
  }

  const uploadId = randomUUID()
  const filename = safeFilename(file.name)
  const mimeType = file.type || "application/octet-stream"
  const buffer = Buffer.from(await file.arrayBuffer())

  const bucket = serverEnv.STORAGE_BUCKET_FRAMEWORK_UPLOADS
  const key = `org/${ctx.org.id}/frameworks/uploads/${uploadId}/${filename}`
  await uploadStream({ bucket, key, stream: Readable.from(buffer), contentType: mimeType })

  const upload = await prisma.documentUpload.create({
    data: {
      id: uploadId,
      orgId: ctx.org.id,
      userId: ctx.user.id,
      bucket,
      path: key,
      filename,
      mimeType,
      sizeBytes: BigInt(buffer.length),
      status: "uploaded",
    },
  })

  const extracted = (await extractText({ buffer, filename, mimeType })).trim()
  if (!extracted) {
    await prisma.documentUpload.update({
      where: { id: upload.id },
      data: { status: "ocr_required" },
    })
    return NextResponse.json({ data: { extractionId: upload.id, ocrRequired: true } })
  }

  const extractedBucket = serverEnv.STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT
  const extractedKey = `org/${ctx.org.id}/frameworks/uploads/${uploadId}/extracted.txt`
  await uploadStream({ bucket: extractedBucket, key: extractedKey, stream: Readable.from(extracted), contentType: "text/plain; charset=utf-8" })

  await prisma.documentUpload.update({
    where: { id: upload.id },
    data: { status: "extracted", extractedTextPath: extractedKey },
  })

  return NextResponse.json({ data: { extractionId: upload.id, ocrRequired: false } })
}

