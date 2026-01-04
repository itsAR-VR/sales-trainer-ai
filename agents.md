# AGENTS.md — sales-trainer-ai Repository Guide

Scope: This file governs the **sales-trainer-ai** codebase (Next.js App Router + Supabase + Prisma + Recall.ai + framework extraction + call analysis).  
Read this first if you’re contributing, reviewing, or acting as an automated coding agent.

> This repo started as a v0-generated Next.js UI and is now wired end-to-end (auth, DB, storage, webhooks, worker, AI extraction/analysis).  
> The human-friendly overview is in `README.md`. This file is the “how to work safely + effectively” guide.

---

## Reading order (fast ramp)

1. `README.md` — setup, env, and high-level system notes
2. `COMPLETEPROJECTPLAN` — V1/V2 scope & architecture roadmap (reference)
3. `prisma/schema.prisma` + `prisma/migrations/**` — data model + migrations baseline
4. `app/` — UI pages + API route handlers (Next.js App Router)
5. `scripts/` — worker + live QA scripts

---

## Non-negotiables (Do / Don’t)

### Do
- **Keep diffs small and local.** Prefer focused changes over “drive-by refactors.”
- **Preserve tenancy boundaries.** Any DB read/write must remain org-scoped (orgId / membership context).
- **Validate every API input.** Use zod schemas for request bodies and for AI outputs before DB writes.
- **Keep AI outputs JSON-only** and schema-validated before persisting.
- **Use Node runtime** for routes that depend on Node APIs (streams, pdf parsing, doc parsing).
- **Gate debug output** to privileged roles only (OWNER/ADMIN) and only when explicitly requested.
- **Run checks appropriate to your change** (lint/tests; live QA scripts if touching production-integrated flows).

### Don’t
- **Don’t commit secrets** (`.env*`, Supabase keys, Recall tokens, OpenAI keys, Vercel tokens).
- **Don’t log sensitive call content** (transcripts, recordings, raw webhook payloads) outside controlled admin tooling.
- **Don’t edit Prisma migration SQL by hand** unless you’re intentionally repairing a bad migration; prefer Prisma workflows.
- **Don’t broaden the AI model allowlist** without updating env validation/model picker logic + docs.
- **Don’t expose “debug” diagnostics** to normal users (keep them privileged + minimal).

---

## What you’re building (projects/workstreams)

### V1 (core platform)
- **Call capture & ingestion:** Recall bots/webhooks → jobs queue → worker downloads artifacts → uploads to Supabase Storage → deletes from Recall.
- **Call library:** searchable calls, call detail with playback + transcript.
- **Framework system:** versioned frameworks (templates + custom), framework builder, and framework import (PDF/DOCX/MD).
- **Post-call analysis:** summaries, action items, scoring vs active FrameworkVersion, and structured CRM export payload.
- **Integrations:** tenant-aware API + embed tokens + outbound webhooks so other dashboards can consume call artifacts.

### V2 (scaffolded / coming soon)
- **Live coaching** (low-latency transcription, real-time guidance)
- **Content Studio** (generate assets from calls)
- **White-label** (domains, branding, per-tenant theming)

---

## Repo map (mental model)

High-signal paths you’ll touch often:

- `app/(app)/app/**` — authenticated UI routes (Calls, Clients, Frameworks, Admin, Content Studio)
- `app/api/**` — API route handlers (framework import, webhooks, etc.)
- `features/**` — UI feature modules (calls, clients, frameworks, admin)
- `components/**` — shared UI components (page header, skeletons, feature gate, shadcn/ui)
- `lib/**` — API client/helpers used by pages/features
- `src/lib/**` — “server-side core” utilities (env, storage/S3 helpers, etc.)
- `prisma/**` — schema + migrations
- `scripts/**` — worker + live QA scripts
- `test/fixtures/**` — fixtures for frameworks import/extraction

---

## Local setup (expected workflow)

1) Install
```bash
pnpm install
````

2. Configure env

```bash
cp .env.example .env.local
# Prisma CLI reads `.env` (not `.env.local`)
cp .env.local .env
```

3. Apply migrations + seed

```bash
pnpm db:deploy
pnpm db:seed
```

4. Run dev

```bash
pnpm dev
```

---

## Commands (by intent)

### Day-to-day

```bash
pnpm dev
pnpm lint
pnpm test
```

### Database (Prisma)

```bash
pnpm db:migrate   # create a new migration locally (interactive)
pnpm db:deploy    # apply migrations in CI/prod (non-interactive)
pnpm db:seed
```

**If your DB was previously created with `prisma db push`:** baseline once so Prisma doesn’t re-create tables:

```bash
pnpm prisma migrate resolve --applied 20260103000000_init
```

### Worker / jobs

```bash
pnpm worker
```

### Live QA (against deployed env)

```bash
pnpm live:smoke
pnpm live:deep-qa   # writes screenshots under artifacts/deep-qa/
```

---

## Deployment (Vercel CLI)

This project deploys via Vercel under the `zrg` scope/workspace.

```bash
vercel link --scope zrg --project sales-trainer-ai --yes
vercel deploy --prod --scope zrg
vercel inspect https://sales-trainer-ai-two.vercel.app --scope zrg
vercel inspect https://sales-trainer-ai-two.vercel.app --scope zrg --logs
```

Vercel runs the `vercel-build` script:

```bash
pnpm vercel-build
# (internally: prisma migrate deploy && prisma generate && next build)
```

---

## Framework import pipeline (important)

UI entrypoint:

* `app/(app)/app/frameworks/import/page.tsx`

Supported uploads:

* **PDF**, **DOCX**, **Markdown**

Flow (UI steps):

1. Upload document → `uploadFrameworkDocument(file)` → returns `extractionId`
2. Extract text → `getExtractedText(extractionId)`
3. Generate draft schema → `generateFrameworkDraft(extractionId)`
4. Save as new framework + version → `createFramework(...)` + `saveFrameworkVersionDraft(...)`

Server routes (key ones):

* `app/api/frameworks/import/upload/route.ts`
* `app/api/frameworks/import/finalize/route.ts`

Extraction rules:

* Prefer fast parsers for MD/PDF/DOCX; if extraction fails or yields empty → mark `ocr_required`.
* If `?debug=1` is present, only privileged roles (OWNER/ADMIN) can receive debug details.

Vercel gotcha:

* Some libs export differently under bundlers; use robust dynamic imports and validate the export is callable.

---

## AI usage rules (platform safety + consistency)

* Model usage is controlled/validated by env + model-picker logic.
* Keep outputs **structured JSON** and validate with zod before writing to DB.
* Never include secrets or raw transcript dumps in prompts unless explicitly required and scoped to an org/admin workflow.
* Prefer deterministic extraction/validation first; use AI for the “hard” parts (drafting structured framework schema, scoring, summaries).

---

## Security & privacy

This product handles recordings and transcripts.

* Treat all recordings/transcripts as **sensitive customer data**.
* Avoid logging raw content; log IDs and status only.
* Ensure every API route that returns call media/transcripts enforces org membership.
* Keep storage buckets private; return signed URLs via server-controlled endpoints.

---

## MCP tooling (from your config.toml)

Available MCP servers:

* context7 (docs/knowledge)
* GitHub (repo browsing via github-mcp-server)
* playwright (UI automation for validation)
* supabase (DB/storage ops for project-ref `ujyifjntoahuxsgirgma`)
* jam (utility MCP)

Guidance:

* Use **GitHub MCP** for code/commit navigation and patching.
* Use **Supabase MCP** for schema/table checks and storage validation (server-side only; never expose keys).
* Use **Playwright MCP** for validating critical UI flows (framework import, calls pages, admin monitoring).
* Use **Context7** when you need authoritative docs quickly (Prisma/Next/Supabase/Recall behaviors).

---

## “When in doubt” checklist

Before finishing a change:

* [ ] Linted (`pnpm lint`)
* [ ] Tests green (`pnpm test`) or explained why not applicable
* [ ] No secrets added to repo
* [ ] Multi-tenant scoping preserved
* [ ] API inputs + AI outputs validated (zod)
* [ ] If touching Vercel/server routes, considered runtime/bundler constraints
* [ ] If touching framework import/extraction, validated PDF/DOCX/MD happy paths and failure modes

```
