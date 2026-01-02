import { JobStatus, JobType, Prisma } from "@prisma/client"
import { prisma } from "@/src/lib/prisma"

export async function enqueueJob(opts: {
  orgId: string
  callId?: string | null
  type: JobType
  payload: Prisma.InputJsonValue
  runAt?: Date
  dedupeKey?: string
}) {
  try {
    return await prisma.job.create({
      data: {
        orgId: opts.orgId,
        callId: opts.callId ?? null,
        type: opts.type,
        payloadJson: opts.payload,
        status: JobStatus.PENDING,
        runAt: opts.runAt ?? new Date(),
        dedupeKey: opts.dedupeKey,
      },
    })
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return null
    }
    throw e
  }
}

