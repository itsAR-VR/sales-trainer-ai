import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const events = await prisma.webhookEvent.findMany({
    where: { orgId: ctx.org.id },
    orderBy: { receivedAt: "desc" },
    take: 100,
  })

  return NextResponse.json({
    data: events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      url: e.provider,
      status: e.error ? ("failed" as const) : ("delivered" as const),
      statusCode: e.error ? 500 : 200,
      attempts: 1,
      createdAt: e.receivedAt.toISOString(),
      payload: e.payloadJson,
      response: e.error ?? null,
    })),
  })
}

