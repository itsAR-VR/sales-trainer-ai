import fs from "node:fs"
import path from "node:path"

function parseDotenv(content) {
  const env = {}
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eq = line.indexOf("=")
    if (eq === -1) continue
    const key = line.slice(0, eq).trim()
    let val = line.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    env[key] = val
  }
  return env
}

function loadEnv() {
  const fromProcess = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  }

  if (fromProcess.NEXT_PUBLIC_APP_URL && fromProcess.SEED_ADMIN_EMAIL && fromProcess.SEED_ADMIN_PASSWORD) return fromProcess

  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return fromProcess
  const fileEnv = parseDotenv(fs.readFileSync(envPath, "utf8"))

  return {
    NEXT_PUBLIC_APP_URL: fromProcess.NEXT_PUBLIC_APP_URL ?? fileEnv.NEXT_PUBLIC_APP_URL,
    SEED_ADMIN_EMAIL: fromProcess.SEED_ADMIN_EMAIL ?? fileEnv.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: fromProcess.SEED_ADMIN_PASSWORD ?? fileEnv.SEED_ADMIN_PASSWORD,
  }
}

async function main() {
  const { chromium } = await import("playwright")

  const env = loadEnv()
  const baseURL = env.NEXT_PUBLIC_APP_URL
  const email = env.SEED_ADMIN_EMAIL
  const password = env.SEED_ADMIN_PASSWORD

  if (!baseURL || !email || !password) throw new Error("Missing NEXT_PUBLIC_APP_URL / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD")

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.fill("#email", email)
  await page.fill("#password", password)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
    page.click('button:has-text("Sign in")'),
  ])

  await page.goto("/app/calls", { waitUntil: "domcontentloaded" })
  if (page.url().includes("/login")) throw new Error("Redirected to /login after attempting login when visiting /app/calls")

  const healthResp = await context.request.get(new URL("/api/health", baseURL).toString())
  if (healthResp.status() !== 200) {
    throw new Error(`/api/health returned ${healthResp.status()}: ${(await healthResp.text()).slice(0, 200)}`)
  }

  await browser.close()
  process.stdout.write("LIVE SMOKE OK: UI login + /app/calls + /api/health\n")
}

await main()
