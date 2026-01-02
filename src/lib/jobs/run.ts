import { prisma } from "@/src/lib/prisma"
import { processJob } from "@/src/lib/jobs/processor"
import { runDueJobsOnceCore } from "@/src/lib/jobs/runCore"

export async function runDueJobsOnce(opts?: { limit?: number }) {
  return runDueJobsOnceCore({ prisma, processJob, limit: opts?.limit })
}
