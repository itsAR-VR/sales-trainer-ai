import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { sha256Hex, randomToken } from "@/src/lib/security/crypto"

const createSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
})

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const webhooks = await prisma.outboundWebhookSubscription.findMany({
    where: { orgId: ctx.org.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    data: webhooks.map((w) => ({
      id: w.id,
      url: w.url,
      events: w.events,
      enabled: !w.disabledAt,
      secret: `whsec_${w.secretHash.slice(0, 8)}`,
      createdAt: w.createdAt.toISOString(),
      lastTriggeredAt: null,
      lastStatus: null,
    })),
  })
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const secret = `whsec_${randomToken(18)}`
  const secretHash = sha256Hex(secret)

  const created = await prisma.outboundWebhookSubscription.create({
    data: { orgId: ctx.org.id, url: parsed.data.url, events: parsed.data.events, secretHash },
  })

  return NextResponse.json({
    data: {
      id: created.id,
      url: created.url,
      events: created.events,
      enabled: true,
      secret,
      createdAt: created.createdAt.toISOString(),
      lastTriggeredAt: null,
      lastStatus: null,
    },
  })
}

