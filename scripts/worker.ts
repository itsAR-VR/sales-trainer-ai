import "../src/lib/env"
import { runDueJobsOnce } from "../src/lib/jobs/run"

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

async function main() {
  // eslint-disable-next-line no-console
  console.log("worker: started")
  while (true) {
    const processed = await runDueJobsOnce({ limit: 5 })
    await sleep(processed > 0 ? 250 : 1500)
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error("worker: fatal", e)
  process.exit(1)
})

