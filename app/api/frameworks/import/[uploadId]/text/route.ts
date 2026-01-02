import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { serverEnv } from "@/src/lib/env"
import { downloadObjectToBuffer } from "@/src/lib/storage/s3"

export async function GET(_request: Request, context: { params: Promise<{ uploadId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { uploadId } = await context.params
  const upload = await prisma.documentUpload.findFirst({
    where: { id: uploadId, orgId: ctx.org.id },
    select: { extractedTextPath: true, status: true },
  })
  if (!upload) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Upload not found" } }, { status: 404 })
  if (!upload.extractedTextPath) {
    return NextResponse.json({ error: { code: "NOT_READY", message: "Extracted text not available" }, status: upload.status }, { status: 409 })
  }

  const buf = await downloadObjectToBuffer({ bucket: serverEnv.STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT, key: upload.extractedTextPath })
  return NextResponse.json({ data: { text: buf.toString("utf8") } })
}

