import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    vercelEnv: process.env.VERCEL_ENV ?? null,
    vercelUrl: process.env.VERCEL_URL ?? null,
    gitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  })
}

