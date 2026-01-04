import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { serverEnv } from "@/src/lib/env"
import { downloadObjectToBuffer } from "@/src/lib/storage/s3"
import { FrameworkDraftSchema } from "@/src/lib/ai/schemas"
import { createJsonCompletion } from "@/src/lib/ai/jsonCompletion"
import { pickModelComplex } from "@/src/lib/ai/modelPicker"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(_request: Request, context: { params: Promise<{ uploadId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  try {
    const { uploadId } = await context.params
    const upload = await prisma.documentUpload.findFirst({
      where: { id: uploadId, orgId: ctx.org.id },
      select: { extractedTextPath: true, status: true },
    })
    if (!upload) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Upload not found" } }, { status: 404 })
    if (!upload.extractedTextPath) {
      return NextResponse.json(
        { error: { code: "NOT_READY", message: "Extracted text not available" }, status: upload.status },
        { status: 409 },
      )
    }

    const buf = await downloadObjectToBuffer({ bucket: serverEnv.STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT, key: upload.extractedTextPath })
    const extractedText = buf.toString("utf8").slice(0, 25_000)

    const promptViewText = [
      "Extract a sales framework from the document text below.",
      "Return ONLY valid JSON matching this shape:",
      "{ phases: [{ name, objective?, rubric?, questions: [{ text, tags, weight, required }], battleCards: [{ title, triggerTags, content }] }] }",
      "",
      "Document text:",
      extractedText,
    ].join("\n")

    const draft = await createJsonCompletion({
      model: pickModelComplex(),
      schema: FrameworkDraftSchema,
      messages: [
        {
          role: "system",
          content:
            "You extract sales frameworks from messy documents. Return only JSON. Prefer concise phase names and concrete questions. Do not copy large chunks verbatim.",
        },
        { role: "user", content: promptViewText },
      ],
    })

    const saved = await prisma.frameworkDraft.upsert({
      where: { uploadId },
      create: {
        uploadId,
        orgId: ctx.org.id,
        generatedSchemaJson: draft.value,
        promptViewText,
        modelInfoJson: { model: draft.model, usage: draft.usage },
      },
      update: {
        generatedSchemaJson: draft.value,
        promptViewText,
        modelInfoJson: { model: draft.model, usage: draft.usage },
      },
    })

    return NextResponse.json({ data: { draftId: saved.id, promptViewText, schema: draft.value } })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: { code: "INTERNAL_ERROR", message: msg || "Request failed" } }, { status: 500 })
  }
}
