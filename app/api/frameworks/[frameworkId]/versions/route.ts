import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"

const questionSchema = z.object({
  id: z.string().optional(),
  text: z.string().min(1),
  weight: z.number().int().min(1).max(5).default(1),
  tags: z.array(z.string()).default([]),
})

const phaseSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  order: z.number().int().min(0),
  objective: z.string().optional(),
  rubric: z.string().optional(),
  questions: z.array(questionSchema).default([]),
})

const bodySchema = z.object({
  phases: z.array(phaseSchema),
  makeActive: z.boolean().default(true),
})

export async function POST(request: Request, context: { params: Promise<{ frameworkId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { frameworkId } = await context.params
  const framework = await prisma.framework.findFirst({
    where: { id: frameworkId, orgId: ctx.org.id },
    include: { versions: { select: { versionNumber: true } } },
  })
  if (!framework) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Framework not found" } }, { status: 404 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const nextVersionNumber = (framework.versions.map((v) => v.versionNumber).sort((a, b) => b - a)[0] ?? 0) + 1

  const versionId = await prisma.$transaction(async (tx) => {
    if (parsed.data.makeActive) {
      await tx.frameworkVersion.updateMany({ where: { frameworkId, isActive: true }, data: { isActive: false } })
    }
    const version = await tx.frameworkVersion.create({
      data: { frameworkId, versionNumber: nextVersionNumber, isActive: parsed.data.makeActive, createdByUserId: ctx.user.id },
      select: { id: true },
    })

    const phases = parsed.data.phases.sort((a, b) => a.order - b.order)
    for (const [i, phase] of phases.entries()) {
      const createdPhase = await tx.frameworkPhase.create({
        data: { frameworkVersionId: version.id, sortOrder: i, name: phase.name, objective: phase.objective, rubricJson: phase.rubric ? { text: phase.rubric } : null },
        select: { id: true },
      })
      for (const q of phase.questions) {
        await tx.frameworkQuestion.create({ data: { phaseId: createdPhase.id, text: q.text, tags: q.tags, weight: q.weight } })
      }
    }
    return version.id
  })

  return NextResponse.json({ data: { versionId } })
}

