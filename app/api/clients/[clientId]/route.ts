import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { clientId } = await context.params
  const client = await prisma.client.findFirst({
    where: { id: clientId, orgId: ctx.org.id },
    include: {
      externalRefs: { select: { systemName: true, externalId: true } },
      calls: { take: 1, orderBy: { scheduledAt: "desc", }, select: { scheduledAt: true } },
      _count: { select: { calls: true } },
    },
  })
  if (!client) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Client not found" } }, { status: 404 })

  return NextResponse.json({
    data: {
      id: client.id,
      name: client.name,
      company: client.company ?? undefined,
      email: client.email ?? undefined,
      phone: client.phone ?? undefined,
      externalRefs: client.externalRefs.map((r) => `${r.systemName}:${r.externalId}`),
      totalCalls: client._count.calls,
      lastCallAt: client.calls[0]?.scheduledAt.toISOString(),
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    },
  })
}

