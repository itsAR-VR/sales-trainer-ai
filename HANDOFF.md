# Handoff — sales-trainer-ai (Jan 4, 2026)

## At a glance

- Repo: `itsAR-VR/sales-trainer-ai` (branch: `main`)
- Vercel project: `zrg/sales-trainer-ai`
- Production alias: `https://sales-trainer-ai-two.vercel.app`
- Current prod gitSha (from `GET /api/health`): `97a67d7d8bb6de3b7e4715c5a6d2a9493261e5e6` (timestamp `2026-01-04T12:16:28.955Z`)
- Primary regression check: `pnpm live:smoke`
- Original report (framework uploads): `https://jam.dev/c/d65b1ec8-39f7-43d3-b5a1-91703e6148f1`

## What was fixed (recent)

### 1) Framework uploads (PDF) failing in prod

**Symptoms (from Jam / prod):**
- `413` on document upload (Vercel request body size limits)
- `500` during PDF extraction / draft generation

**Fixes:**
- Replaced multipart upload for framework docs with a **direct-to-Supabase Storage** upload flow to bypass Vercel body limits:
  - `POST /api/frameworks/import/presign` → `{ uploadId, bucket, key, url }`
  - Browser `PUT` to `url`
  - `POST /api/frameworks/import/finalize` → server downloads from Storage, extracts text, writes `extracted.txt`, updates `DocumentUpload`
- Fixed a serverless-only PDF parsing bug:
  - `pdf-parse`’s package entrypoint can run a debug demo in some bundling environments (ENOENT for `./test/data/...`).
  - Switched imports to `pdf-parse/lib/pdf-parse.js` for correctness in Vercel/Next.
- Hardened framework draft generation:
  - Added `runtime = "nodejs"` / `maxDuration = 60`.
  - Trimmed extracted text to ~25k chars before sending to OpenAI.
  - Clamped question `weight` to `1..5` so model “drift” doesn’t hard-fail schema validation.
- Stabilized saving framework versions:
  - Replaced per-question inserts with `createMany`.
  - Increased Prisma interactive transaction timeout (`timeout: 60s`).

## Key files / endpoints

### Framework import pipeline
- `app/api/frameworks/import/presign/route.ts` — returns a presigned PUT URL
- `app/api/frameworks/import/finalize/route.ts` — downloads + extracts + writes `extracted.txt`
  - Admin-only debug: `POST /api/frameworks/import/finalize?debug=1`
- `app/api/frameworks/import/[uploadId]/text/route.ts` — fetch extracted text
- `app/api/frameworks/import/[uploadId]/draft/route.ts` — OpenAI draft generation (JSON-only)

### Framework persistence
- `app/api/frameworks/[frameworkId]/versions/route.ts` — save a new version (now batched + hardened)
- `lib/api.ts`:
  - `uploadFrameworkDocument()` — presign → PUT → finalize
  - `saveFrameworkVersionDraft()` — now returns `versionId` (no follow-up GET required)

### QA
- `scripts/live-smoke.mjs` — logs in + checks `/api/health`, `/api/me`, `/api/admin/storage`, embeds, framework import PDF + apply to a call
- `test/fixtures/framework-example.pdf` — PDF fixture used by smoke test
- `test/fixtures/framework-example.md` — tiny “known good” import fixture

## How to verify (fast)

### 1) Confirm deploy + gitSha
```bash
curl -s https://sales-trainer-ai-two.vercel.app/api/health
```

### 2) Run live smoke
```bash
pnpm live:smoke
```

This requires these env vars (do **not** commit them):
- `NEXT_PUBLIC_APP_URL`
- `SEED_ADMIN_EMAIL`
- `SEED_ADMIN_PASSWORD`

The script loads them from process env or `.env.local`.

### 3) Manual UI path (prod)
1) Log in → go to `/app/frameworks/import`
2) Upload a PDF → confirm you see extracted text
3) Generate Draft → Save Framework → open a call → Framework tab → select framework → Apply

## Environment notes

- Prisma reads `.env` (not `.env.local`):
  - Local dev: copy `.env.local` → `.env` (never commit either).
- DB:
  - `DATABASE_URL` should typically be pooled/pgbouncer.
  - `DIRECT_URL` must be direct Postgres (no pgbouncer).
- Storage:
  - Client uses presigned PUT URLs (no S3 creds in browser).
  - Server uses S3 creds for HEAD/GET/PUT in finalize + other server flows.

## Known gaps / TODOs

- OCR is **not** implemented; scanned/image-based PDFs will show “OCR required” and block draft generation.
- Worker doesn’t run automatically on Vercel:
  - Requires Vercel Cron hitting `POST /api/admin/run-jobs` with `CRON_SECRET`.
- “Send to CRM” and “Download” buttons remain placeholders/stubs.
- Call ingestion isn’t fully “real” end-to-end yet (some orgs may have empty calls/clients until seeded via API).

## Recommended next steps (priority order)

1) Add GitHub Actions live regression:
   - Run `pnpm live:smoke` nightly or on main merges using repo secrets.
2) Ensure background jobs run in prod:
   - Confirm Vercel Cron is configured + `CRON_SECRET` is set.
3) Implement OCR or a fallback:
   - Either integrate an OCR provider or allow paste-in text as a fallback for scanned PDFs.
4) Finish end-to-end call ingestion:
   - Create call + optional Recall bot from UI, process webhooks, persist artifacts, show real call detail outputs.
5) Observability:
   - Add error reporting for 500s (esp. import/draft/version save) and audit admin endpoints.

