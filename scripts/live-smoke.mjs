import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

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

function getLocalGitSha() {
  try {
    return execSync("git rev-parse HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim()
  } catch {
    return null
  }
}

async function expectOkJson(resp, label) {
  const status = resp.status()
  const contentType = resp.headers()["content-type"] || ""
  const text = await resp.text()
  if (status !== 200) {
    throw new Error(`${label} returned ${status}: ${text.slice(0, 200)}`)
  }
  if (!contentType.includes("application/json")) {
    throw new Error(`${label} returned unexpected content-type (${contentType}): ${text.slice(0, 200)}`)
  }
  return JSON.parse(text)
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

  // 1) Verify auth protection when logged out.
  await page.goto("/app/calls", { waitUntil: "domcontentloaded" })
  if (!page.url().includes("/login")) {
    throw new Error(`Expected /app/calls to redirect to /login when logged out, but landed on: ${page.url()}`)
  }

  // 2) UI login
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.fill("#email", email)
  await page.fill("#password", password)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
    page.click('button:has-text("Sign in")'),
  ])

  await page.goto("/app/calls", { waitUntil: "domcontentloaded" })
  if (page.url().includes("/login")) throw new Error("Redirected to /login after attempting login when visiting /app/calls")

  // 3) Health + deploy sanity
  const localGitSha = getLocalGitSha()
  const health = await expectOkJson(await context.request.get(new URL("/api/health", baseURL).toString()), "/api/health")
  if (localGitSha && health.gitSha && health.gitSha !== localGitSha) {
    throw new Error(`Deployment mismatch: live gitSha=${health.gitSha} but local HEAD=${localGitSha} (redeploy expected commit)`)
  }

  // 4) Authenticated API checks
  await expectOkJson(await context.request.get(new URL("/api/me", baseURL).toString()), "/api/me")
  await expectOkJson(await context.request.get(new URL("/api/admin/storage", baseURL).toString()), "/api/admin/storage")

  // 5) Fetch a call + client id
  const calls = await expectOkJson(await context.request.get(new URL("/api/calls", baseURL).toString()), "/api/calls")
  const clients = await expectOkJson(await context.request.get(new URL("/api/clients", baseURL).toString()), "/api/clients")

  const callId = calls?.data?.[0]?.id
  const clientId = clients?.data?.[0]?.id
  if (!callId || !clientId) throw new Error("No call/client returned from /api/calls or /api/clients (seed data missing?)")

  // 6) Embed tokens + embed page loads
  const callTokenResp = await expectOkJson(
    await context.request.post(new URL("/api/integrations/embeds/token", baseURL).toString(), {
      data: { scope: "call", resourceId: callId, expiresHours: 1 },
    }),
    "POST /api/integrations/embeds/token (call)",
  )

  const clientTokenResp = await expectOkJson(
    await context.request.post(new URL("/api/integrations/embeds/token", baseURL).toString(), {
      data: { scope: "client", resourceId: clientId, expiresHours: 1 },
    }),
    "POST /api/integrations/embeds/token (client)",
  )

  const callEmbedUrl = callTokenResp?.data?.embedUrl
  const clientEmbedUrl = clientTokenResp?.data?.embedUrl
  if (!callEmbedUrl || !clientEmbedUrl) throw new Error("Embed token response missing embedUrl")

  // Missing token should 404 (no 500s).
  const missingCallEmbed = await context.request.get(new URL(`/embed/calls/${callId}`, baseURL).toString())
  if (![404].includes(missingCallEmbed.status())) {
    throw new Error(`/embed/calls/${callId} without token should be 404, got ${missingCallEmbed.status()}`)
  }

  await page.goto(callEmbedUrl, { waitUntil: "domcontentloaded" })
  if (!page.url().includes(`/embed/calls/${callId}`)) throw new Error("Failed to load call embed page")

  await page.goto(clientEmbedUrl, { waitUntil: "domcontentloaded" })
  if (!page.url().includes(`/embed/clients/${clientId}`)) throw new Error("Failed to load client embed page")

  await browser.close()
  process.stdout.write("LIVE SMOKE OK: auth redirect + UI login + /api/health + /api/me + /api/admin/storage + embeds\n")
}

await main()
