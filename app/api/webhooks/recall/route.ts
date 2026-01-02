import { NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { serverEnv } from "@/src/lib/env"
import { enqueueJob } from "@/src/lib/jobs/enqueue"
import { JobType } from "@prisma/client"
import { verifySvixWebhook } from "@/src/lib/recall/webhook"

export const runtime = "nodejs"

function getSvixHeaders(request: Request) {
  const svixId = request.headers.get("svix-id")
  const svixTimestamp = request.headers.get("svix-timestamp")
  const svixSignature = request.headers.get("svix-signature")
  if (!svixId || !svixTimestamp || !svixSignature) return null
  return { "svix-id": svixId, "svix-timestamp": svixTimestamp, "svix-signature": svixSignature }
}

function extractFromPayload(payload: any) {
  const data = payload?.data ?? payload
  return {
    eventId: payload?.id ?? payload?.event_id ?? null,
    eventType: payload?.type ?? payload?.event_type ?? null,
    botId: data?.bot_id ?? data?.botId ?? payload?.bot_id ?? null,
    meetingUrl: data?.meeting_url ?? data?.meetingUrl ?? payload?.meeting_url ?? null,
    recordingId:
      data?.recording_id ??
      data?.recordingId ??
      payload?.recording_id ??
      payload?.recordingId ??
      data?.recording?.id ??
      payload?.recording?.id ??
      null,
  }
}

export async function POST(request: Request) {
  const svixHeaders = getSvixHeaders(request)
  if (!svixHeaders) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Missing Svix headers" } }, { status: 400 })
  }

  const rawBody = await request.text()
  let payload: any
  try {
    payload = verifySvixWebhook({
      rawBody,
      headers: svixHeaders,
      signingSecret: serverEnv.RECALL_WEBHOOK_SIGNING_SECRET,
      toleranceSeconds: serverEnv.RECALL_WEBHOOK_TOLERANCE_SECONDS,
    })
  } catch {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid webhook" } }, { status: 400 })
  }

  const extracted = extractFromPayload(payload)
  const eventId = String(extracted.eventId ?? svixHeaders["svix-id"])
  const eventType = String(extracted.eventType ?? "unknown")

  // Attempt to map to org/call via stored Recall bot or meeting URL.
  const botId = typeof extracted.botId === "string" ? extracted.botId : null
  const meetingUrl = typeof extracted.meetingUrl === "string" ? extracted.meetingUrl : null

  let callId: string | null = null
  let orgId: string | null = null

  if (botId) {
    const bot = await prisma.recallBot.findUnique({ where: { recallBotId: botId }, select: { callId: true, call: { select: { orgId: true } } } })
    if (bot) {
      callId = bot.callId
      orgId = bot.call.orgId
    }
  }

  if (!callId && meetingUrl) {
    const call = await prisma.call.findFirst({ where: { meetingUrl }, select: { id: true, orgId: true } })
    if (call) {
      callId = call.id
      orgId = call.orgId
    }
  }

  try {
    await prisma.webhookEvent.create({
      data: {
        provider: "recall",
        eventType,
        eventId,
        payloadJson: payload,
        status: "received",
        orgId,
        callId,
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ ok: true, deduped: true })
    }
    throw e
  }

  const recordingId = typeof extracted.recordingId === "string" ? extracted.recordingId : null
  const shouldFinalize = eventType.includes("recording") && (eventType.includes("done") || eventType.includes("ready") || eventType.includes("completed"))

  if (shouldFinalize && orgId && callId && recordingId) {
    await prisma.recallRecording.upsert({
      where: { recallRecordingId: recordingId },
      create: { callId, recallRecordingId: recordingId, status: "pending" },
      update: { callId },
    })

    await enqueueJob({
      orgId,
      callId,
      type: JobType.FINALIZE_RECORDING,
      payload: { orgId, callId, recallRecordingId: recordingId },
      dedupeKey: `finalize:${recordingId}`,
    })
  }

  return NextResponse.json({ ok: true })
}
