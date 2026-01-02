import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiFramework } from "@/src/lib/ui/mappers"

export async function GET(_request: Request, context: { params: Promise<{ frameworkId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { frameworkId } = await context.params
  const framework = await prisma.framework.findFirst({
    where: { id: frameworkId, orgId: ctx.org.id },
    include: { versions: { include: { phases: { include: { questions: true } } } } },
  })
  if (!framework) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Framework not found" } }, { status: 404 })

  const calls = await prisma.call.findMany({
    where: { orgId: ctx.org.id, frameworkVersion: { frameworkId } },
    select: { frameworkScores: { take: 1, orderBy: { createdAt: "desc" }, select: { payloadJson: true } } },
  })
  const overallScores = calls
    .map((c) => (c.frameworkScores[0]?.payloadJson as any)?.overallScore)
    .filter((n): n is number => typeof n === "number")
  const avgCoverage = overallScores.length ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length) : 0

  return NextResponse.json({
    data: {
      ...toUiFramework(framework),
      callCount: calls.length,
      avgCoverage,
    },
  })
}

