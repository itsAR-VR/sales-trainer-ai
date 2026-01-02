import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { JobStatus } from "@prisma/client"

function mapStatus(status: JobStatus) {
  switch (status) {
    case JobStatus.PENDING:
      return "pending" as const
    case JobStatus.RETRYING:
      return "retrying" as const
    case JobStatus.RUNNING:
      return "running" as const
    case JobStatus.COMPLETED:
      return "completed" as const
    case JobStatus.FAILED:
      return "failed" as const
  }
}

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const jobs = await prisma.job.findMany({
    where: { orgId: ctx.org.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  return NextResponse.json({
    data: jobs.map((j) => ({
      id: j.id,
      type: j.type,
      status: mapStatus(j.status),
      progress: j.status === JobStatus.COMPLETED ? 100 : 0,
      callId: j.callId,
      attempts: j.attempts,
      maxAttempts: 8,
      createdAt: j.createdAt.toISOString(),
      startedAt: null,
      completedAt: j.status === JobStatus.COMPLETED ? j.updatedAt.toISOString() : null,
      error: j.lastError ?? null,
    })),
  })
}
