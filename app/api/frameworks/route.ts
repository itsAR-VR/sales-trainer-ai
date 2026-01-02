import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { FrameworkSource } from "@prisma/client"
import { toUiFramework } from "@/src/lib/ui/mappers"

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  templateId: z.string().optional(),
})

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const frameworks = await prisma.framework.findMany({
    where: { orgId: ctx.org.id, isTemplateCatalog: false },
    orderBy: { updatedAt: "desc" },
    include: {
      versions: {
        where: { isActive: true },
        include: { phases: { include: { questions: true } } },
      },
    },
  })

  const enriched = await Promise.all(
    frameworks.map(async (f) => {
      const callCount = await prisma.call.count({ where: { orgId: ctx.org.id, frameworkVersion: { frameworkId: f.id } } })
      return {
        ...toUiFramework({ ...f, versions: f.versions }),
        usageCount: callCount,
      }
    }),
  )

  return NextResponse.json({ data: enriched })
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const { name, description, templateId } = parsed.data

  const template =
    templateId
      ? await prisma.framework.findFirst({
          where: { id: templateId, orgId: ctx.org.id, source: FrameworkSource.TEMPLATE, isTemplateCatalog: true },
          include: { versions: { where: { isActive: true }, include: { phases: { include: { questions: true } } } } },
        })
      : null

  const created = await prisma.$transaction(async (tx) => {
    const framework = await tx.framework.create({
      data: {
        orgId: ctx.org.id,
        name,
        description: description ?? null,
        source: template ? FrameworkSource.TEMPLATE : FrameworkSource.CUSTOM,
        isTemplateCatalog: false,
      },
      select: { id: true },
    })

    const version = await tx.frameworkVersion.create({
      data: { frameworkId: framework.id, versionNumber: 1, isActive: true, createdByUserId: ctx.user.id },
      select: { id: true },
    })

    const sourceVersion = template?.versions[0]
    if (sourceVersion) {
      const phases = sourceVersion.phases.sort((a, b) => a.sortOrder - b.sortOrder)
      for (const p of phases) {
        const newPhase = await tx.frameworkPhase.create({
          data: { frameworkVersionId: version.id, sortOrder: p.sortOrder, name: p.name, objective: p.objective, rubricJson: p.rubricJson },
          select: { id: true },
        })
        for (const q of p.questions) {
          await tx.frameworkQuestion.create({
            data: { phaseId: newPhase.id, text: q.text, tags: q.tags, weight: q.weight },
          })
        }
      }
    }

    return framework.id
  })

  const framework = await prisma.framework.findFirst({
    where: { id: created, orgId: ctx.org.id },
    include: { versions: { include: { phases: { include: { questions: true } } } } },
  })
  if (!framework) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Framework not found" } }, { status: 404 })

  return NextResponse.json({ data: toUiFramework(framework) })
}
