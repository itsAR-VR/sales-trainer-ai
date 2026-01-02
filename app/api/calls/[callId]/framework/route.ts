import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { enqueueJob } from "@/src/lib/jobs/enqueue"
import { JobType } from "@prisma/client"

const bodySchema = z.object({ frameworkVersionId: z.string().min(1) })

export async function POST(request: Request, context: { params: Promise<{ callId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const { callId } = await context.params
  const call = await prisma.call.findFirst({ where: { id: callId, orgId: ctx.org.id }, select: { id: true } })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  const version = await prisma.frameworkVersion.findFirst({
    where: { id: parsed.data.frameworkVersionId, framework: { orgId: ctx.org.id } },
    select: { id: true },
  })
  if (!version) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Framework version not found" } }, { status: 404 })

  await prisma.call.update({ where: { id: callId }, data: { frameworkVersionId: version.id } })
  await enqueueJob({
    orgId: ctx.org.id,
    callId,
    type: JobType.ANALYZE_CALL,
    payload: { orgId: ctx.org.id, callId },
    dedupeKey: `analyze:${callId}:${version.id}`,
  })

  return NextResponse.json({ ok: true })
}

