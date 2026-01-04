import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { serverEnv } from "@/src/lib/env"
import { downloadObjectToBuffer, headObject, uploadStream } from "@/src/lib/storage/s3"
import { Readable } from "node:stream"
import { MembershipRole } from "@prisma/client"

export const runtime = "nodejs"
export const maxDuration = 60

const bodySchema = z.object({
  uploadId: z.string().uuid(),
  bucket: z.string().min(1),
  key: z.string().min(1),
  filename: z.string().min(1),
  mimeType: z.string().min(1),
})

type ExtractTextResult = { text: string; error: Error | null }

async function extractText(opts: { buffer: Buffer; filename: string; mimeType: string }): Promise<ExtractTextResult> {
  const ext = opts.filename.toLowerCase().split(".").pop() ?? ""
  if (opts.mimeType === "text/markdown" || ext === "md") {
    return { text: opts.buffer.toString("utf8"), error: null }
  }
  if (opts.mimeType === "application/pdf" || ext === "pdf") {
    try {
      // NOTE: pdf-parse's package entrypoint runs a debug demo when `module.parent` is falsy,
      // which can happen in Next/Vercel bundling. Import the library entry directly instead.
      const mod = await import("pdf-parse/lib/pdf-parse.js")
      const pdfParse: unknown = (mod as any).default ?? mod
      if (typeof pdfParse !== "function") throw new Error("pdf-parse did not export a function")
      const res = await pdfParse(opts.buffer)
      return { text: (res?.text as string | undefined) || "", error: null }
    } catch (e) {
      return { text: "", error: e instanceof Error ? e : new Error(String(e)) }
    }
  }
  if (opts.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || ext === "docx") {
    try {
      const mod = await import("mammoth")
      const mammoth: any = (mod as any).default ?? mod
      if (!mammoth?.extractRawText) throw new Error("mammoth did not export extractRawText")
      const res = await mammoth.extractRawText({ buffer: opts.buffer })
      return { text: (res?.value as string | undefined) || "", error: null }
    } catch (e) {
      return { text: "", error: e instanceof Error ? e : new Error(String(e)) }
    }
  }
  return { text: "", error: null }
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  try {
    const url = new URL(request.url)
    const debugRequested =
      url.searchParams.get("debug") === "1" &&
      (ctx.membership.role === MembershipRole.OWNER || ctx.membership.role === MembershipRole.ADMIN)

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
    const isPdfHeader = buffer.subarray(0, 5).toString("ascii") === "%PDF-"
    const debug =
      debugRequested
        ? {
            storage: {
              head: {
                contentType: head.contentType,
                sizeBytes: head.sizeBytes ? Number(head.sizeBytes) : null,
                etag: head.etag,
              },
              downloadedBytes: buffer.length,
              isPdfHeader,
              firstBytesHex: buffer.subarray(0, 32).toString("hex"),
            },
          }
        : undefined

    const extractedResult = await extractText({ buffer, filename, mimeType })
    const extracted = extractedResult.text.trim()

    if (extractedResult.error) {
      await prisma.documentUpload.update({
        where: { id: uploadId },
        data: { status: "extract_failed" },
      })
      return NextResponse.json(
        {
          error: {
            code: "EXTRACTION_FAILED",
            message: "Failed to extract text from uploaded document",
            details: debugRequested
              ? { parserError: { name: extractedResult.error.name, message: extractedResult.error.message }, ...debug }
              : undefined,
          },
        },
        { status: 500 },
      )
    }

    if (!extracted) {
      await prisma.documentUpload.update({
        where: { id: uploadId },
        data: { status: "ocr_required" },
      })
      return NextResponse.json({ data: { extractionId: uploadId, ocrRequired: true, debug } })
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

    return NextResponse.json({ data: { extractionId: uploadId, ocrRequired: false, debug } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: msg || "Request failed" } }, { status: 500 })
  }
}
