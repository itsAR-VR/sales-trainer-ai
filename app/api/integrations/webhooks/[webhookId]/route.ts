import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"

const patchSchema = z.object({ enabled: z.boolean() })

export async function PATCH(request: Request, context: { params: Promise<{ webhookId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })
  const { webhookId } = await context.params

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  await prisma.outboundWebhookSubscription.updateMany({
    where: { id: webhookId, orgId: ctx.org.id },
    data: { disabledAt: parsed.data.enabled ? null : new Date() },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: { params: Promise<{ webhookId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })
  const { webhookId } = await context.params

  await prisma.outboundWebhookSubscription.deleteMany({ where: { id: webhookId, orgId: ctx.org.id } })
  return NextResponse.json({ ok: true })
}

