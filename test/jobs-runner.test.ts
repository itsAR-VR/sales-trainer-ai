import { describe, expect, it } from "vitest"
import { JobStatus, type Job } from "@prisma/client"
import { runDueJobsOnceCore } from "../src/lib/jobs/runCore"

function makeJob(overrides?: Partial<Job>): Job {
  const base: Job = {
    id: "job_1",
    orgId: "org_1",
    type: "FINALIZE_RECORDING" as any,
    payloadJson: {} as any,
    status: JobStatus.PENDING,
    attempts: 0,
    runAt: new Date(0),
    lastError: null,
    dedupeKey: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    callId: null,
  }
  return { ...base, ...(overrides ?? {}) }
}

describe("runDueJobsOnceCore", () => {
  it("claims a job once and retries on failure", async () => {
    const job = makeJob({ runAt: new Date(Date.now() - 1000) })
    const store = new Map([[job.id, job]])

    const prisma = {
      job: {
        findMany: async () => [store.get(job.id)!],
        updateMany: async ({ where, data }: any) => {
          const j = store.get(where.id)
          if (!j || j.status !== where.status) return { count: 0 }
          store.set(where.id, { ...j, status: data.status })
          return { count: 1 }
        },
        update: async ({ where, data }: any) => {
          const j = store.get(where.id)!
          store.set(where.id, { ...j, ...data })
          return store.get(where.id)!
        },
      },
      call: { update: async () => ({}) },
    } as any

    let ran = 0
    const processed = await runDueJobsOnceCore({
      prisma,
      processJob: async () => {
        ran += 1
        throw new Error("boom")
      },
      limit: 5,
    })

    expect(processed).toBe(1)
    expect(ran).toBe(1)
    const updated = store.get(job.id)!
    expect(updated.status).toBe(JobStatus.RETRYING)
    expect(updated.attempts).toBe(1)
    expect(typeof updated.lastError).toBe("string")
  })

  it("skips if job already claimed", async () => {
    const job = makeJob({ runAt: new Date(Date.now() - 1000) })
    const store = new Map([[job.id, job]])
    const prisma = {
      job: {
        findMany: async () => [store.get(job.id)!],
        updateMany: async () => ({ count: 0 }),
        update: async () => ({}),
      },
      call: { update: async () => ({}) },
    } as any

    const processed = await runDueJobsOnceCore({
      prisma,
      processJob: async () => {
        throw new Error("should not run")
      },
    })

    expect(processed).toBe(0)
  })
})

