import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { enqueueJob } from "@/src/lib/jobs/enqueue"
import { JobType } from "@prisma/client"

export async function POST(_request: Request, context: { params: Promise<{ callId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { callId } = await context.params
  const call = await prisma.call.findFirst({
    where: { id: callId, orgId: ctx.org.id },
    include: { recordings: { take: 1, orderBy: { createdAt: "desc" }, select: { recallRecordingId: true } } },
  })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  const recordingId = call.recordings[0]?.recallRecordingId
  if (!recordingId) {
    return NextResponse.json({ error: { code: "BAD_REQUEST", message: "No Recall recording is linked to this call" } }, { status: 400 })
  }

  await enqueueJob({
    orgId: ctx.org.id,
    callId,
    type: JobType.FINALIZE_RECORDING,
    payload: { orgId: ctx.org.id, callId, recallRecordingId: recordingId },
    dedupeKey: `finalize:${recordingId}`,
  })

  return NextResponse.json({ ok: true })
}

