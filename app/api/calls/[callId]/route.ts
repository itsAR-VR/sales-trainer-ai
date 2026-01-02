import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiCall } from "@/src/lib/ui/mappers"

export async function GET(_request: Request, context: { params: Promise<{ callId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { callId } = await context.params
  const call = await prisma.call.findFirst({
    where: { id: callId, orgId: ctx.org.id },
    include: {
      client: true,
      participants: true,
      mediaAssets: true,
      callSummary: true,
      actionItems: true,
      frameworkScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  return NextResponse.json({ data: toUiCall(call) })
}

