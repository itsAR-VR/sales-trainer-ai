import { z } from "zod"

export const CallSummarySchema = z.object({
  overview: z.string().min(1),
  keyMoments: z
    .array(
      z.object({
        timeMs: z.number().int().nonnegative(),
        label: z.string().min(1),
        detail: z.string().min(1),
      }),
    )
    .default([]),
  objections: z
    .array(
      z.object({
        text: z.string().min(1),
        response: z.string().optional(),
      }),
    )
    .default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
})

export const ActionItemsSchema = z.object({
  items: z.array(
    z.object({
      text: z.string().min(1),
      owner: z.string().optional(),
      dueDate: z.string().optional(),
    }),
  ),
})

export const CrmExportSchema = z.object({
  subject: z.string().min(1),
  summary: z.string().min(1),
  keyPoints: z.array(z.string().min(1)).default([]),
  nextSteps: z.array(z.string().min(1)).default([]),
})

export const FrameworkScoreSchema = z.object({
  overallScore: z.number().int().min(0).max(100),
  phaseScores: z.array(
    z.object({
      phaseName: z.string().min(1),
      score: z.number().int().min(0).max(100),
      coveredQuestions: z.number().int().min(0),
      totalQuestions: z.number().int().min(0),
    }),
  ),
  missedQuestions: z.array(
    z.object({
      phaseName: z.string().min(1),
      questionText: z.string().min(1),
    }),
  ),
  coachingPlan: z.object({
    nextCallAgenda: z.array(z.string().min(1)).default([]),
    questionsToAsk: z.array(z.string().min(1)).default([]),
  }),
})

export const FrameworkDraftSchema = z.object({
  name: z.string().min(1).optional(),
  phases: z.array(
    z.object({
      name: z.string().min(1),
      objective: z.string().min(1).optional(),
      rubric: z.string().min(1).optional(),
      questions: z.array(
        z.object({
          text: z.string().min(1),
          tags: z.array(z.string()).default([]),
          weight: z
            .coerce
            .number()
            .int()
            .catch(1)
            .transform((n) => (Number.isFinite(n) ? Math.max(1, Math.min(5, n)) : 1)),
          required: z.boolean().default(false),
        }),
      ),
      battleCards: z
        .array(
          z.object({
            title: z.string().min(1),
            triggerTags: z.array(z.string()).default([]),
            content: z.string().min(1),
          }),
        )
        .default([]),
    }),
  ),
})
