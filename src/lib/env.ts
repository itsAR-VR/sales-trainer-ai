import { z } from "zod"

const openAiModelSchema = z.enum(["gpt-5-nano", "gpt-5-mini", "gpt-5.1"])

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
})

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),

  SUPABASE_STORAGE_S3_ENDPOINT: z.string().url(),
  SUPABASE_STORAGE_S3_REGION: z.string().min(1),
  SUPABASE_STORAGE_S3_ACCESS_KEY_ID: z.string().min(1),
  SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY: z.string().min(1),

  STORAGE_BUCKET_CALL_MEDIA: z.string().min(1),
  STORAGE_BUCKET_CALL_TRANSCRIPTS: z.string().min(1),
  STORAGE_BUCKET_CALL_ARTIFACTS: z.string().min(1),
  STORAGE_BUCKET_FRAMEWORK_UPLOADS: z.string().min(1),
  STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT: z.string().min(1),
  STORAGE_BUCKET_ANALYSIS: z.string().min(1),

  RECALL_API_KEY: z.string().min(1),
  RECALL_WEBHOOK_SIGNING_SECRET: z.string().min(1),
  RECALL_WEBHOOK_TOLERANCE_SECONDS: z.coerce.number().int().positive(),
  RECALL_RETENTION_HOURS: z.coerce.number().int().positive(),

  OPENAI_API_KEY: z.string().min(1),
  OPENAI_MODEL_SIMPLE: openAiModelSchema,
  OPENAI_MODEL_MEDIUM: openAiModelSchema,
  OPENAI_MODEL_COMPLEX: openAiModelSchema,

  APP_ENCRYPTION_KEY: z.string().min(32),
  EMBED_TOKEN_SECRET: z.string().min(16),
  CRON_SECRET: z.string().min(16),

  ADMIN_ACTIONS_SECRET: z.string().min(16).optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>
export type ServerEnv = z.infer<typeof serverEnvSchema>

function formatEnvError(error: z.ZodError): string {
  const byKey = new Map<string, string[]>()
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "(root)"
    const list = byKey.get(key) ?? []
    list.push(issue.message)
    byKey.set(key, list)
  }

  const lines = [...byKey.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, msgs]) => `- ${key}: ${msgs.join("; ")}`)
    .join("\n")
  return `Invalid environment variables:\n${lines}`
}

function parseServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse(process.env)
  if (!parsed.success) throw new Error(formatEnvError(parsed.error))

  const { OPENAI_MODEL_SIMPLE, OPENAI_MODEL_MEDIUM, OPENAI_MODEL_COMPLEX } = parsed.data
  if (OPENAI_MODEL_SIMPLE !== "gpt-5-nano" || OPENAI_MODEL_MEDIUM !== "gpt-5-mini" || OPENAI_MODEL_COMPLEX !== "gpt-5.1") {
    throw new Error(
      [
        "Invalid OpenAI model mapping:",
        `- OPENAI_MODEL_SIMPLE must be gpt-5-nano (got ${OPENAI_MODEL_SIMPLE})`,
        `- OPENAI_MODEL_MEDIUM must be gpt-5-mini (got ${OPENAI_MODEL_MEDIUM})`,
        `- OPENAI_MODEL_COMPLEX must be gpt-5.1 (got ${OPENAI_MODEL_COMPLEX})`,
      ].join("\n"),
    )
  }

  return parsed.data
}

function parseClientEnv(): ClientEnv {
  const parsed = clientEnvSchema.safeParse(process.env)
  if (!parsed.success) throw new Error(formatEnvError(parsed.error))
  return parsed.data
}

/**
 * `env` is safe to import from both server and client code:
 * - On the server it validates and exposes server-only secrets.
 * - In the browser it validates and exposes only NEXT_PUBLIC_* values.
 */
export const env: ServerEnv | ClientEnv = typeof window === "undefined" ? parseServerEnv() : parseClientEnv()

export const publicEnv: ClientEnv =
  typeof window === "undefined" ? clientEnvSchema.parse(process.env) : (env as ClientEnv)

export const serverEnv: ServerEnv =
  typeof window === "undefined"
    ? (env as ServerEnv)
    : (() => {
        throw new Error("serverEnv was imported in a browser bundle")
      })()
