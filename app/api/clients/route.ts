import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const clients = await prisma.client.findMany({
    where: { orgId: ctx.org.id },
    orderBy: { createdAt: "desc" },
    include: {
      externalRefs: { select: { systemName: true, externalId: true } },
      calls: { take: 1, orderBy: { scheduledAt: "desc" }, select: { scheduledAt: true } },
      _count: { select: { calls: true } },
    },
  })

  return NextResponse.json({
    data: clients.map((c) => ({
      id: c.id,
      name: c.name,
      company: c.company ?? undefined,
      email: c.email ?? undefined,
      phone: c.phone ?? undefined,
      externalRefs: c.externalRefs.map((r) => `${r.systemName}:${r.externalId}`),
      totalCalls: c._count.calls,
      lastCallAt: c.calls[0]?.scheduledAt.toISOString(),
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    })),
  })
}

