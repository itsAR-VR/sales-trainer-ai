import { CallStatus, JobStatus, type Job, type PrismaClient } from "@prisma/client"

const MAX_ATTEMPTS = 8

function backoffMs(attempt: number) {
  const base = Math.min(60_000, 1_000 * 2 ** Math.max(0, attempt - 1))
  const jitter = Math.floor(Math.random() * 250)
  return base + jitter
}

function toErrorMessage(e: unknown) {
  if (e instanceof Error) return e.stack || e.message
  return String(e)
}

export async function runDueJobsOnceCore(opts: {
  prisma: PrismaClient
  processJob: (prisma: PrismaClient, job: Job) => Promise<void>
  limit?: number
  now?: Date
}) {
  const limit = opts.limit ?? 5
  const now = opts.now ?? new Date()

  const due = await opts.prisma.job.findMany({
    where: { status: { in: [JobStatus.PENDING, JobStatus.RETRYING] }, runAt: { lte: now } },
    orderBy: { runAt: "asc" },
    take: limit,
  })

  let processed = 0

  for (const job of due) {
    const claimed = await opts.prisma.job.updateMany({
      where: { id: job.id, status: job.status },
      data: { status: JobStatus.RUNNING },
    })
    if (claimed.count === 0) continue

    processed += 1

    try {
      await opts.processJob(opts.prisma, job)
      await opts.prisma.job.update({ where: { id: job.id }, data: { status: JobStatus.COMPLETED } })
    } catch (e) {
      const nextAttempts = job.attempts + 1
      const msg = toErrorMessage(e)

      if (nextAttempts >= MAX_ATTEMPTS) {
        await opts.prisma.job.update({
          where: { id: job.id },
          data: { status: JobStatus.FAILED, attempts: nextAttempts, lastError: msg },
        })
        if (job.callId) {
          await opts.prisma.call.update({ where: { id: job.callId }, data: { status: CallStatus.FAILED } }).catch(() => {})
        }
        continue
      }

      const delay = backoffMs(nextAttempts)
      await opts.prisma.job.update({
        where: { id: job.id },
        data: {
          status: JobStatus.RETRYING,
          attempts: nextAttempts,
          lastError: msg,
          runAt: new Date(Date.now() + delay),
        },
      })
    }
  }

  return processed
}

