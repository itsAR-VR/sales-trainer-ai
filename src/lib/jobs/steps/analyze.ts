import "server-only"

import type { PrismaClient } from "@prisma/client"
import { pickModelComplex, pickModelMedium } from "@/src/lib/ai/modelPicker"
import { createJsonCompletion } from "@/src/lib/ai/jsonCompletion"
import { ActionItemsSchema, CallSummarySchema, CrmExportSchema, FrameworkScoreSchema } from "@/src/lib/ai/schemas"

function buildTranscriptText(segments: Array<{ speakerLabel: string; startMs: number; endMs: number; text: string }>) {
  return segments
    .sort((a, b) => a.startMs - b.startMs)
    .map((s) => {
      const t = Math.floor(s.startMs / 1000)
      const mm = String(Math.floor(t / 60)).padStart(2, "0")
      const ss = String(t % 60).padStart(2, "0")
      return `[${mm}:${ss}] ${s.speakerLabel}: ${s.text}`
    })
    .join("\n")
}

export async function analyzeCallWithOpenAI(prisma: PrismaClient, callId: string) {
  const call = await prisma.call.findUnique({
    where: { id: callId },
    include: {
      client: true,
      transcriptSegments: { select: { speakerLabel: true, startMs: true, endMs: true, text: true } },
      frameworkVersion: {
        include: { phases: { include: { questions: true }, orderBy: { sortOrder: "asc" } } },
      },
    },
  })
  if (!call) throw new Error("Call not found")
  if (!call.transcriptSegments.length) throw new Error("No transcript segments available")

  const transcriptText = buildTranscriptText(call.transcriptSegments)

  const summary = await createJsonCompletion({
    model: pickModelMedium(),
    schema: CallSummarySchema,
    messages: [
      {
        role: "system",
        content:
          "You are a call analysis assistant. Return only JSON. Do not include markdown. Do not hallucinate facts not present in the transcript.",
      },
      {
        role: "user",
        content: `Analyze this sales call transcript and produce a concise structured summary.\n\nTRANSCRIPT:\n${transcriptText}`,
      },
    ],
  })

  const actionItems = await createJsonCompletion({
    model: pickModelMedium(),
    schema: ActionItemsSchema,
    messages: [
      {
        role: "system",
        content:
          "You are a call analysis assistant. Return only JSON. Extract concrete action items that follow from the transcript. Avoid duplicates.",
      },
      { role: "user", content: `Extract action items from this transcript.\n\nTRANSCRIPT:\n${transcriptText}` },
    ],
  })

  const crmExport = await createJsonCompletion({
    model: pickModelMedium(),
    schema: CrmExportSchema,
    messages: [
      {
        role: "system",
        content:
          "You write CRM-ready call notes. Return only JSON. Keep it short and specific. Do not include confidential data beyond what's in transcript.",
      },
      {
        role: "user",
        content: `Create CRM-ready call notes.\n\nCall title: ${call.title}\nClient: ${call.client?.name ?? "Unknown"}\n\nTRANSCRIPT:\n${transcriptText}`,
      },
    ],
  })

  await prisma.$transaction(async (tx) => {
    await tx.callSummary.upsert({
      where: { callId },
      create: {
        callId,
        payloadJson: summary.value,
        modelInfoJson: { model: summary.model, usage: summary.usage },
        promptVersion: "v1",
      },
      update: {
        payloadJson: summary.value,
        modelInfoJson: { model: summary.model, usage: summary.usage },
        promptVersion: "v1",
      },
    })

    await tx.actionItem.deleteMany({ where: { callId } })
    for (const item of actionItems.value.items) {
      await tx.actionItem.create({
        data: { callId, text: item.text, status: "open" },
      })
    }

    await tx.crmNoteExport.deleteMany({ where: { callId } })
    await tx.crmNoteExport.create({
      data: {
        callId,
        payloadJson: crmExport.value,
      },
    })
  })

  if (call.frameworkVersionId && call.frameworkVersion) {
    const frameworkText = call.frameworkVersion.phases
      .map((p) => `Phase: ${p.name}\nQuestions:\n${p.questions.map((q) => `- (${q.weight}x) ${q.text}`).join("\n")}`)
      .join("\n\n")

    const score = await createJsonCompletion({
      model: pickModelComplex(),
      schema: FrameworkScoreSchema,
      messages: [
        {
          role: "system",
          content:
            "You are a strict framework scoring engine. Return only JSON. Score adherence based only on evidence in the transcript.",
        },
        {
          role: "user",
          content: `Framework:\n${frameworkText}\n\nTranscript:\n${transcriptText}\n\nReturn an overall score (0-100), phaseScores, missedQuestions, and a coachingPlan.`,
        },
      ],
    })

    await prisma.frameworkScore.deleteMany({ where: { callId, frameworkVersionId: call.frameworkVersionId } })
    await prisma.frameworkScore.create({
      data: {
        callId,
        frameworkVersionId: call.frameworkVersionId,
        payloadJson: { ...score.value, modelInfo: { model: score.model, usage: score.usage } },
      },
    })
  }
}

