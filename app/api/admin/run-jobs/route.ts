import { NextResponse } from "next/server"
import { serverEnv } from "@/src/lib/env"
import { runDueJobsOnce } from "@/src/lib/jobs/run"

async function handle(request: Request) {
  const provided =
    request.headers.get("x-cron-secret") ||
    new URL(request.url).searchParams.get("secret") ||
    request.headers.get("authorization")?.replace(/^Bearer /, "")

  if (!provided || provided !== serverEnv.CRON_SECRET) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Invalid CRON secret" } }, { status: 401 })
  }

  const processed = await runDueJobsOnce({ limit: 10 })
  return NextResponse.json({ ok: true, processed })
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
