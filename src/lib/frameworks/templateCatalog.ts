import { FrameworkSource } from "@prisma/client"
import type { PrismaClient } from "@prisma/client"

export type FrameworkTemplateSpec = {
  name: string
  phases: Array<{
    name: string
    objective: string
    rubric: { criteria: string[] }
    questions: Array<{ text: string; weight: number; tags: string[] }>
  }>
}

export const frameworkTemplateCatalog: FrameworkTemplateSpec[] = [
  {
    name: "Discovery Essentials",
    phases: [
      {
        name: "Opening",
        objective: "Set context, align on goals, and confirm timing.",
        rubric: { criteria: ["Confirms agenda", "Confirms time", "Establishes next step"] },
        questions: [
          { text: "What prompted you to take this meeting?", weight: 2, tags: ["opening", "context"] },
          { text: "How much time do we have today?", weight: 1, tags: ["opening", "logistics"] },
          { text: "What would make this conversation valuable for you?", weight: 2, tags: ["opening", "success"] },
        ],
      },
      {
        name: "Discovery",
        objective: "Understand current state, pain, impact, and desired outcomes.",
        rubric: { criteria: ["Uncovers pain", "Quantifies impact", "Clarifies success criteria"] },
        questions: [
          { text: "What are the top challenges you're trying to solve right now?", weight: 3, tags: ["discovery", "pain"] },
          { text: "What happens if this stays the same for the next 3–6 months?", weight: 3, tags: ["discovery", "impact"] },
          { text: "How will you measure success if we solve this?", weight: 2, tags: ["discovery", "success"] },
        ],
      },
    ],
  },
  {
    name: "Demo + Next Steps",
    phases: [
      {
        name: "Demo Framing",
        objective: "Connect demo flow to confirmed pains and outcomes.",
        rubric: { criteria: ["States demo goal", "Maps to pains", "Checks understanding"] },
        questions: [
          { text: "Before I show anything, can I confirm the 2–3 things you care most about?", weight: 2, tags: ["demo", "alignment"] },
          { text: "Does this match how you think about the problem?", weight: 1, tags: ["demo", "validation"] },
        ],
      },
      {
        name: "Closing",
        objective: "Agree on next steps, stakeholders, and timeline.",
        rubric: { criteria: ["Clear next step", "Mutual plan", "Timeline defined"] },
        questions: [
          { text: "What would you like to do next?", weight: 2, tags: ["close", "next_steps"] },
          { text: "Who else needs to be involved in the decision?", weight: 2, tags: ["close", "stakeholders"] },
          { text: "What timeline are you working toward?", weight: 2, tags: ["close", "timeline"] },
        ],
      },
    ],
  },
]

export async function ensureOrgFrameworkTemplates(prisma: PrismaClient, orgId: string) {
  for (const spec of frameworkTemplateCatalog) {
    const existing = await prisma.framework.findFirst({
      where: { orgId, source: FrameworkSource.TEMPLATE, name: spec.name },
      select: { id: true },
    })
    if (existing) continue

    await prisma.$transaction(async (tx) => {
      const framework = await tx.framework.create({
        data: { orgId, name: spec.name, source: FrameworkSource.TEMPLATE, isTemplateCatalog: true },
        select: { id: true },
      })

      const version = await tx.frameworkVersion.create({
        data: { frameworkId: framework.id, versionNumber: 1, isActive: true },
        select: { id: true },
      })

      for (const [idx, phase] of spec.phases.entries()) {
        const createdPhase = await tx.frameworkPhase.create({
          data: {
            frameworkVersionId: version.id,
            sortOrder: idx,
            name: phase.name,
            objective: phase.objective,
            rubricJson: phase.rubric,
          },
          select: { id: true },
        })

        for (const q of phase.questions) {
          await tx.frameworkQuestion.create({
            data: { phaseId: createdPhase.id, text: q.text, tags: q.tags, weight: q.weight },
          })
        }
      }
    })
  }
}
