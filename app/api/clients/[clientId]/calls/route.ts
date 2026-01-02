import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiCall } from "@/src/lib/ui/mappers"

export async function GET(_request: Request, context: { params: Promise<{ clientId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { clientId } = await context.params
  const client = await prisma.client.findFirst({ where: { id: clientId, orgId: ctx.org.id }, select: { id: true } })
  if (!client) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Client not found" } }, { status: 404 })

  const calls = await prisma.call.findMany({
    where: { orgId: ctx.org.id, clientId },
    orderBy: { scheduledAt: "desc" },
    include: { client: true, participants: true, mediaAssets: true, callSummary: true, actionItems: true, frameworkScores: { take: 1, orderBy: { createdAt: "desc" } } },
  })
  return NextResponse.json({ data: calls.map(toUiCall) })
}

