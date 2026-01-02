import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { SpeakerRole } from "@prisma/client"

const bodySchema = z.object({ role: z.enum(["rep", "prospect", "other"]) })

export async function POST(request: Request, context: { params: Promise<{ callId: string; participantId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { callId, participantId } = await context.params
  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const call = await prisma.call.findFirst({ where: { id: callId, orgId: ctx.org.id }, select: { id: true } })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  const participant = await prisma.participant.findFirst({ where: { id: participantId, callId }, select: { id: true, speakerLabel: true } })
  if (!participant) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Participant not found" } }, { status: 404 })

  const role =
    parsed.data.role === "rep" ? SpeakerRole.REP : parsed.data.role === "prospect" ? SpeakerRole.PROSPECT : SpeakerRole.OTHER

  await prisma.$transaction(async (tx) => {
    await tx.participant.update({ where: { id: participant.id }, data: { speakerRole: role } })
    await tx.transcriptSegment.updateMany({ where: { callId, speakerLabel: participant.speakerLabel }, data: { speakerRole: role } })
  })

  return NextResponse.json({ ok: true })
}

