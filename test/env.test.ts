import { describe, expect, it, vi } from "vitest"

function setRequiredEnv(overrides?: Record<string, string>) {
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000"
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon"

  process.env.SUPABASE_SERVICE_ROLE_KEY = "service"
  process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db"
  process.env.DIRECT_URL = "postgresql://user:pass@localhost:5432/db"

  process.env.SUPABASE_STORAGE_S3_ENDPOINT = "https://s3.example.local"
  process.env.SUPABASE_STORAGE_S3_REGION = "us-east-1"
  process.env.SUPABASE_STORAGE_S3_ACCESS_KEY_ID = "access"
  process.env.SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY = "secret"

  process.env.STORAGE_BUCKET_CALL_MEDIA = "call-media"
  process.env.STORAGE_BUCKET_CALL_TRANSCRIPTS = "call-transcripts"
  process.env.STORAGE_BUCKET_CALL_ARTIFACTS = "call-artifacts"
  process.env.STORAGE_BUCKET_FRAMEWORK_UPLOADS = "fw-uploads"
  process.env.STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT = "fw-text"
  process.env.STORAGE_BUCKET_ANALYSIS = "analysis"

  process.env.RECALL_API_KEY = "recall"
  process.env.RECALL_WEBHOOK_SIGNING_SECRET = "whsec"
  process.env.RECALL_WEBHOOK_TOLERANCE_SECONDS = "300"
  process.env.RECALL_RETENTION_HOURS = "24"

  process.env.OPENAI_API_KEY = "openai"
  process.env.OPENAI_MODEL_SIMPLE = "gpt-5-nano"
  process.env.OPENAI_MODEL_MEDIUM = "gpt-5-mini"
  process.env.OPENAI_MODEL_COMPLEX = "gpt-5.1"

  process.env.APP_ENCRYPTION_KEY = "x".repeat(32)
  process.env.EMBED_TOKEN_SECRET = "y".repeat(16)
  process.env.CRON_SECRET = "z".repeat(16)

  for (const [k, v] of Object.entries(overrides ?? {})) process.env[k] = v
}

describe("env validation", () => {
  it("throws with missing required env", async () => {
    const original = { ...process.env }
    try {
      process.env = { ...original } as any
      setRequiredEnv()
      delete process.env.OPENAI_API_KEY
      vi.resetModules()
      await expect(import("../src/lib/env")).rejects.toThrow(/Invalid environment variables/i)
    } finally {
      process.env = original as any
    }
  })

  it("parses when required env present", async () => {
    const original = { ...process.env }
    try {
      process.env = { ...original } as any
      setRequiredEnv()
      vi.resetModules()
      const mod = await import("../src/lib/env")
      expect((mod.env as any).OPENAI_MODEL_SIMPLE).toBe("gpt-5-nano")
    } finally {
      process.env = original as any
    }
  })
})
