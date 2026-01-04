import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request, context: { params: Promise<{ callId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const url = new URL(request.url)
  const download = url.searchParams.get("download") === "1" || url.searchParams.get("download") === "true"

  const { callId } = await context.params
  const call = await prisma.call.findFirst({
    where: { id: callId, orgId: ctx.org.id },
    include: {
      client: true,
      callSummary: true,
      actionItems: true,
      participants: true,
      frameworkScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  const crm = await prisma.crmNoteExport.findFirst({ where: { callId }, orderBy: { createdAt: "desc" } })
  if (!crm) return NextResponse.json({ data: null })

  const summaryPayload = call.callSummary?.payloadJson as any
  const recordedAt = (call.startedAt ?? call.scheduledAt).toISOString()
  const duration =
    call.startedAt && call.endedAt ? Math.max(0, Math.round((call.endedAt.getTime() - call.startedAt.getTime()) / 1000)) : 0

  const payload = {
    callId: call.id,
    title: call.title,
    client: { id: call.clientId ?? "", name: call.client?.name ?? "Unknown" },
    summary: typeof summaryPayload?.overview === "string" ? summaryPayload.overview : "",
    keyPoints: Array.isArray(summaryPayload?.keyPoints) ? summaryPayload.keyPoints : [],
    actionItems: call.actionItems.map((ai) => ({ text: ai.text })),
    participants: call.participants.map((p) => ({ name: p.name ?? p.speakerLabel, role: p.speakerRole })),
    frameworkScore: call.frameworkScores[0]
      ? {
          name: "Framework",
          score: (call.frameworkScores[0].payloadJson as any)?.overallScore ?? 0,
        }
      : undefined,
    recordedAt,
    duration,
  }

  if (download) {
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="crm-export-${callId}.json"`,
      },
    })
  }

  return NextResponse.json({ data: payload })
}
