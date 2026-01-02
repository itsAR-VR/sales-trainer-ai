import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { FrameworkSource } from "@prisma/client"
import { toUiFrameworkTemplate } from "@/src/lib/ui/mappers"

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const templates = await prisma.framework.findMany({
    where: { orgId: ctx.org.id, source: FrameworkSource.TEMPLATE, isTemplateCatalog: true },
    orderBy: { name: "asc" },
    include: { versions: { where: { isActive: true }, include: { phases: { include: { questions: true } } } } },
  })

  return NextResponse.json({ data: templates.map(toUiFrameworkTemplate) })
}
