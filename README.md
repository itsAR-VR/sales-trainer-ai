# Sales Trainer AI (Next.js + Supabase + Prisma + Recall.ai + OpenAI)

This repo started as a v0-generated Next.js App Router UI. It’s now wired up end-to-end with:
- Supabase Auth (email/password) + SSR middleware protection for `/app/*`
- Supabase Postgres via Prisma (org-scoped multi-tenant schema + migrations)
- Supabase Storage via S3-compatible API (private buckets, multipart uploads, signed downloads)
- Recall.ai webhooks (Svix signature verification) + worker to archive recordings and delete them from Recall after successful upload
- OpenAI-powered framework extraction + post-call analysis (**models restricted to** `gpt-5-nano`, `gpt-5-mini`, `gpt-5.1`)

## Repo map

- `app/` — Next.js App Router routes (UI + `/api/*`)
- `prisma/schema.prisma` — full data model
- `src/lib/env.ts` — zod env validation (fail-fast)
- `src/lib/supabase/*` — Supabase browser/server clients (`@supabase/ssr`)
- `src/lib/jobs/*` + `scripts/worker.ts` — job queue + worker loop
- `src/lib/recall/*` — Recall API client + Svix webhook verification helpers
- `src/lib/storage/*` — S3 upload/download/sign helpers (forcePathStyle)
- `src/lib/ai/*` — OpenAI helpers + zod schemas for structured outputs
- `test/*` — Vitest unit tests

## Quick start

1) Install deps
```bash
pnpm install
```

2) Configure env
```bash
cp .env.example .env.local
# Prisma CLI loads `.env` (not `.env.local`)
cp .env.local .env
```

3) Apply migrations + seed templates
```bash
pnpm db:deploy
pnpm db:seed
```

4) Run the app
```bash
pnpm dev
```

5) Run the worker (separate terminal)
```bash
pnpm worker
```

## Environment variables

All env vars are validated at boot by `src/lib/env.ts`. Missing/invalid envs will crash early with a clear error.

Client (safe to expose):
- `NEXT_PUBLIC_APP_URL` (e.g. `http://localhost:3000`)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Server-only (do not expose to the browser):
- Supabase / DB:
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `DATABASE_URL` (typically pooled/pgbouncer)
  - `DIRECT_URL` (direct Postgres; **do not** use pgbouncer here)
- Supabase Storage (S3-compatible):
  - `SUPABASE_STORAGE_S3_ENDPOINT` (typically `https://<project>.supabase.co/storage/v1/s3`)
  - `SUPABASE_STORAGE_S3_REGION`
  - `SUPABASE_STORAGE_S3_ACCESS_KEY_ID`
  - `SUPABASE_STORAGE_S3_SECRET_ACCESS_KEY`
  - `STORAGE_BUCKET_CALL_MEDIA`
  - `STORAGE_BUCKET_CALL_TRANSCRIPTS`
  - `STORAGE_BUCKET_CALL_ARTIFACTS`
  - `STORAGE_BUCKET_FRAMEWORK_UPLOADS`
  - `STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT`
  - `STORAGE_BUCKET_ANALYSIS`
- Recall.ai:
  - `RECALL_API_KEY`
  - `RECALL_WEBHOOK_SIGNING_SECRET`
  - `RECALL_WEBHOOK_TOLERANCE_SECONDS`
  - `RECALL_RETENTION_HOURS`
- OpenAI (restricted models only):
  - `OPENAI_API_KEY`
  - `OPENAI_MODEL_SIMPLE` (**must be** `gpt-5-nano`)
  - `OPENAI_MODEL_MEDIUM` (**must be** `gpt-5-mini`)
  - `OPENAI_MODEL_COMPLEX` (**must be** `gpt-5.1`)
- App secrets:
  - `APP_ENCRYPTION_KEY` (>= 32 chars; general-purpose server secret)
  - `EMBED_TOKEN_SECRET`
  - `CRON_SECRET`
  - `ADMIN_ACTIONS_SECRET` (optional)

See `.env.example` for a full template.

## Supabase setup

### 1) Auth
- Enable Email/Password auth in Supabase.
- If email confirmations are enabled, signup will show a “check your email” message.

Auth routes:
- `/login`, `/signup`, `/forgot-password`, `/reset-password`
- `/api/auth/logout` (server logout)

The app uses `proxy.ts` (Next.js 16 convention) to refresh sessions and protect `/app/*` (redirects to `/login`).

### 2) Database (Prisma)
- Set `DATABASE_URL` and `DIRECT_URL` from Supabase’s Postgres connection strings.
- Apply migrations + seed:
  - `pnpm db:deploy`
  - `pnpm db:seed`

On first login, the server automatically creates an `Organization` + `Membership` if none exist and ensures framework templates exist (no client-side org storage).

#### Migrations (important)

This repo uses Prisma migrations (`prisma/migrations/*`).

- Create a new migration locally:
  - `pnpm db:migrate`
- Apply migrations in a non-interactive environment (prod/CI):
  - `pnpm db:deploy`

**No `db push` policy:** shared environments (preview/prod) must be migration-first. The `pnpm db:push` script is guarded and will only run against an explicitly-allowed local database.

**If your database was previously created with `prisma db push`:**
You must baseline the existing DB once so Prisma doesn’t try to re-create tables.

```bash
pnpm prisma migrate resolve --applied 20260103000000_init
```

Prisma CLI note: it reads `.env` by default, so keep `.env` in sync with `.env.local` (do not commit either).

### 3) Storage buckets (private)

Create **private** buckets in Supabase Storage with names matching:
- `STORAGE_BUCKET_CALL_MEDIA` (video/audio)
- `STORAGE_BUCKET_CALL_TRANSCRIPTS`
- `STORAGE_BUCKET_CALL_ARTIFACTS`
- `STORAGE_BUCKET_FRAMEWORK_UPLOADS`
- `STORAGE_BUCKET_FRAMEWORK_EXTRACTED_TEXT`
- `STORAGE_BUCKET_ANALYSIS`

### 4) Storage S3 credentials

This app uploads to Storage via Supabase’s S3-compatible endpoint (multipart) and generates **signed** download URLs server-side for playback.

In Supabase Dashboard:
- Go to Storage settings and create S3 access keys.
- Set `SUPABASE_STORAGE_S3_ENDPOINT` to the project endpoint (typically `https://<project>.supabase.co/storage/v1/s3`).
- Keep buckets private; the UI never receives S3 credentials.

## Recall.ai setup

### Webhook URL
Set Recall’s webhook endpoint to:
- `POST {NEXT_PUBLIC_APP_URL}/api/webhooks/recall`

### Signature verification (Svix)
The webhook handler verifies Svix headers (`svix-id`, `svix-timestamp`, `svix-signature`) using:
- `RECALL_WEBHOOK_SIGNING_SECRET`
- `RECALL_WEBHOOK_TOLERANCE_SECONDS`

It stores events idempotently (unique `eventId`) and enqueues work for the worker (the webhook stays fast).

### Local development note
Recall must reach your machine. Use a tunnel (e.g. ngrok/cloudflared) and set:
- `NEXT_PUBLIC_APP_URL` to the public tunnel URL
- the Recall webhook URL to `{NEXT_PUBLIC_APP_URL}/api/webhooks/recall`

## Creating calls / starting bots

The Calls UI lists calls, but does not include a “create bot” button yet. You can create a call (and optionally a Recall bot) via API.

Example (requires being logged in; uses your browser session cookies):
```bash
curl -X POST http://localhost:3000/api/calls \
  -H 'Content-Type: application/json' \
  -d '{
    "title": "Demo call",
    "meetingUrl": "https://example.com/your-meeting-url",
    "platform": "zoom",
    "createRecallBot": true
  }'
```

Webhook events map back to your call using the meeting URL and/or stored `recallBotId`.

## Worker / jobs

Local worker:
```bash
pnpm worker
```

Server/cron runner (e.g. Vercel Cron):
- This repo includes `vercel.json` Cron Jobs config to hit `GET /api/admin/run-jobs` every 5 minutes.
- If you configure Cron Jobs manually, you can also `POST /api/admin/run-jobs`.
- Provide the secret via one of:
  - `Authorization: Bearer <CRON_SECRET>`
  - `x-cron-secret: <CRON_SECRET>`
  - `?secret=<CRON_SECRET>`

Job types:
- `FINALIZE_RECORDING`
  - Fetches recording + `media_shortcuts` from Recall
  - Streams artifacts to Storage (multipart upload), verifies via `HEAD`, stores `MediaAsset`
  - Only after required assets are verified: deletes the recording from Recall and marks it deleted in DB
  - Enqueues analysis
- `ANALYZE_CALL`
  - Parses/stores transcript segments
  - Generates structured `CallSummary`, `ActionItems`, and `CRMNoteExport`
  - If a framework is attached to the call: generates `FrameworkScore`
- `RECONCILE_INCOMPLETE_CALLS` (best-effort) retries stuck calls within retention windows

Idempotency:
- Webhooks: stored with unique `eventId`
- Jobs: `dedupeKey` prevents duplicate enqueues
- Media uploads: `MediaAsset` is unique by `(bucket, path)` and verified uploads are skipped on retry

## OpenAI usage (server-only)

Model usage is **guaranteed** by env validation + model picker:
- `gpt-5-nano` — simple transforms / small classification
- `gpt-5-mini` — summaries + action items + CRM notes
- `gpt-5.1` — complex extraction/scoring (framework scoring + structured tasks)

All AI outputs are JSON-only and validated with zod schemas before writing to the database.

## Deploying (Vercel / ZRG)

This project is deployed on Vercel under the `zrg` scope/workspace.

Key commands:
```bash
vercel link --scope zrg --project sales-trainer-ai --yes
vercel deploy --prod --scope zrg
vercel inspect https://sales-trainer-ai-two.vercel.app --scope zrg
vercel inspect https://sales-trainer-ai-two.vercel.app --scope zrg --logs
```

Vercel runs the `vercel-build` script from `package.json`, which includes:
- `prisma migrate deploy` (apply migrations)
- `next build`

## QA scripts (live)

- Smoke test (logs in, checks core APIs, validates embeds):
  - `pnpm live:smoke`
- Deep route QA (captures screenshots under `artifacts/deep-qa/`):
  - `pnpm live:deep-qa`

## Frameworks

Frameworks are versioned and immutable-ish:
- The UI saves edits by creating a new `FrameworkVersion` and activating it.
- Template catalog frameworks are seeded and kept separate from user-created frameworks.

### Import / extraction flow
- Upload a doc (PDF/DOCX/MD) at `/app/frameworks/import`
- Stored to `STORAGE_BUCKET_FRAMEWORK_UPLOADS`
- Server extracts text best-effort:
  - PDF: `pdf-parse`
  - DOCX: `mammoth`
  - If OCR is required: extraction is left empty and the UI will show an “OCR required” message (OCR is not implemented yet)
- The server generates:
  1) a structured `FrameworkDraft` JSON for the builder
  2) a “prompt view” text block the user can copy

## Embeds (read-only)

Embeds are minimal-chrome, read-only pages:
- `/embed/calls/[callId]?token=...`
- `/embed/clients/[clientId]?token=...`

Tokens are HMAC-signed with `EMBED_TOKEN_SECRET`, scoped, expiring, and allowlisted in the DB. Embed pages use signed playback URLs (no bucket/public access).

## Admin / observability

The Admin UI (and corresponding APIs) provides read-only visibility and retries for:
- Webhook events (`WebhookEvent`)
- Jobs (`Job`) including retry endpoints
- Basic Storage usage breakdown

## API surface (selected)

All API routes live under `app/api/*` and are org-scoped using the server-derived session org context (except the Recall webhook).

- Calls:
  - `GET /api/calls`
  - `POST /api/calls`
  - `GET /api/calls/[callId]`
  - `GET /api/calls/[callId]/playback`
  - `GET /api/calls/[callId]/transcript`
  - `GET /api/calls/[callId]/crm-export`
  - `POST /api/calls/[callId]/framework` (apply framework + enqueue analysis)
  - `POST /api/calls/[callId]/rerun-finalize`
  - `POST /api/calls/[callId]/participants/[participantId]/role`
- Clients:
  - `GET /api/clients`
  - `GET /api/clients/[clientId]`
  - `GET /api/clients/[clientId]/calls`
- Frameworks:
  - `GET /api/frameworks`
  - `GET /api/frameworks/templates`
  - `GET /api/frameworks/[frameworkId]`
  - `POST /api/frameworks/[frameworkId]/versions`
  - Import flow: `POST /api/frameworks/import/upload` → `GET /api/frameworks/import/[uploadId]/text` → `POST /api/frameworks/import/[uploadId]/draft`
- Integrations:
  - API keys: `GET/POST /api/integrations/api-keys`, `DELETE /api/integrations/api-keys/[apiKeyId]`
  - Outbound webhooks: `GET/POST /api/integrations/webhooks`, `DELETE /api/integrations/webhooks/[webhookId]`
  - Embeds: `POST /api/integrations/embeds/token`
- Org:
  - `GET/PATCH /api/org`
  - Members: `GET/POST /api/org/members`, `PATCH/DELETE /api/org/members/[memberId]`
- Admin:
  - Jobs: `GET /api/admin/jobs`, `POST /api/admin/jobs/[jobId]/retry`
  - Webhook events: `GET /api/admin/webhook-events`
  - Storage usage: `GET /api/admin/storage`
  - Cron runner: `POST /api/admin/run-jobs`
- Recall webhook:
  - `POST /api/webhooks/recall` (Svix-verified; no session auth)

## V2 placeholders

These pages remain feature-gated placeholders but have schema-ready stubs:
- `/app/live-coach`
- `/app/content-studio`
- `/app/white-label`

## Tests

```bash
pnpm test
```

Includes:
- Env validation unit tests
- Svix webhook signature verification unit tests
- Job runner claim/retry/idempotency unit tests (mocked Prisma)

## Troubleshooting

- Boot fails with env error: check `.env.local` and the message from `src/lib/env.ts`.
- Prisma can’t connect: ensure `DIRECT_URL` is the *direct* Supabase Postgres connection string (not pooled).
- Storage upload fails: confirm buckets exist (private), S3 keys are valid, and `SUPABASE_STORAGE_S3_ENDPOINT` ends with `/storage/v1/s3`.
- Recall webhooks rejected: ensure Svix signing secret matches Recall’s config and your clock skew is within `RECALL_WEBHOOK_TOLERANCE_SECONDS`.
