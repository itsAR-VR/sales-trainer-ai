import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { JobStatus } from "@prisma/client"

export async function POST(_request: Request, context: { params: Promise<{ jobId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { jobId } = await context.params
  await prisma.job.updateMany({
    where: { id: jobId, orgId: ctx.org.id },
    data: { status: JobStatus.RETRYING, runAt: new Date(), lastError: null },
  })
  return NextResponse.json({ ok: true })
}

