import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { CallStatus } from "@prisma/client"
import { toUiCall } from "@/src/lib/ui/mappers"
import { z } from "zod"
import { createBot } from "@/src/lib/recall/client"
import { serverEnv } from "@/src/lib/env"

export async function GET(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const url = new URL(request.url)
  const status = url.searchParams.get("status")
  const statusEnum = status ? (status.toUpperCase() as keyof typeof CallStatus) : null

  const calls = await prisma.call.findMany({
    where: {
      orgId: ctx.org.id,
      ...(statusEnum && CallStatus[statusEnum] ? { status: CallStatus[statusEnum] } : {}),
    },
    orderBy: { scheduledAt: "desc" },
    include: {
      client: true,
      participants: true,
      mediaAssets: true,
      callSummary: true,
      actionItems: true,
      frameworkScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })

  return NextResponse.json({ data: calls.map(toUiCall) })
}

const createSchema = z.object({
  title: z.string().min(1),
  meetingUrl: z.string().url(),
  platform: z.string().min(1),
  clientId: z.string().optional(),
  createRecallBot: z.boolean().default(false),
})

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const callId = await prisma.$transaction(async (tx) => {
    let clientId = parsed.data.clientId ?? null
    if (!clientId) {
      const client = await tx.client.create({ data: { orgId: ctx.org.id, name: "Unassigned Client" }, select: { id: true } })
      clientId = client.id
    }

    const call = await tx.call.create({
      data: {
        orgId: ctx.org.id,
        clientId,
        title: parsed.data.title,
        meetingUrl: parsed.data.meetingUrl,
        platform: parsed.data.platform,
        scheduledAt: new Date(),
        status: CallStatus.SCHEDULED,
      },
      select: { id: true },
    })

    if (parsed.data.createRecallBot) {
      const bot = await createBot({
        meetingUrl: parsed.data.meetingUrl,
        retentionHours: serverEnv.RECALL_RETENTION_HOURS,
      })
      const recallBotId = (bot as any)?.id ?? (bot as any)?.bot_id ?? null
      if (typeof recallBotId === "string") {
        await tx.recallBot.create({ data: { callId: call.id, recallBotId, status: "created" } })
      }
    }

    return call.id
  })

  const call = await prisma.call.findFirst({
    where: { id: callId, orgId: ctx.org.id },
    include: { client: true, participants: true, mediaAssets: true, callSummary: true, actionItems: true, frameworkScores: { take: 1, orderBy: { createdAt: "desc" } } },
  })

  return NextResponse.json({ data: call ? toUiCall(call) : null })
}
