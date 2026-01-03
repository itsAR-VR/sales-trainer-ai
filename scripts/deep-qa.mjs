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

function ensureArtifactsDir() {
  const dir = path.join(process.cwd(), "artifacts", "deep-qa")
  fs.mkdirSync(dir, { recursive: true })
  return dir
}

function safeSlug(route) {
  return route.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80)
}

async function expectOkJson(resp, label) {
  const status = resp.status()
  const contentType = resp.headers()["content-type"] || ""
  const text = await resp.text()
  if (status !== 200) throw new Error(`${label} returned ${status}: ${text.slice(0, 200)}`)
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

  const outDir = ensureArtifactsDir()
  const results = []

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ baseURL })
  const page = await context.newPage()

  const pageErrors = []
  const consoleErrors = []
  page.on("pageerror", (err) => pageErrors.push(String(err)))
  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text())
  })

  // Login
  await page.goto("/login", { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle")
  await page.fill("#email", email)
  await page.fill("#password", password)
  await Promise.all([
    page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60000 }),
    page.click('button:has-text("Sign in")'),
  ])

  // Ensure at least 1 call/client for detail pages.
  const calls = await expectOkJson(await context.request.get(new URL("/api/calls", baseURL).toString()), "/api/calls")
  let clients = await expectOkJson(await context.request.get(new URL("/api/clients", baseURL).toString()), "/api/clients")
  let callId = calls?.data?.[0]?.id
  let clientId = clients?.data?.[0]?.id

  if (!callId || !clientId) {
    const demo = await expectOkJson(
      await context.request.post(new URL("/api/calls", baseURL).toString(), {
        data: {
          title: "Demo Call (deep QA)",
          meetingUrl: "https://example.com/meet",
          platform: "zoom",
          createRecallBot: false,
        },
      }),
      "POST /api/calls (seed demo)",
    )
    callId = callId ?? demo?.data?.id
    clientId = clientId ?? demo?.data?.clientId
    clients = await expectOkJson(await context.request.get(new URL("/api/clients", baseURL).toString()), "/api/clients (after seed)")
    clientId = clientId ?? clients?.data?.[0]?.id
  }

  const routes = [
    { path: "/app/calls", expectText: "Calls" },
    ...(callId ? [{ path: `/app/calls/${callId}`, expectText: "Call Details" }] : []),
    { path: "/app/clients", expectText: "Clients" },
    ...(clientId ? [{ path: `/app/clients/${clientId}`, expectText: "Client" }] : []),
    { path: "/app/frameworks", expectText: "Frameworks" },
    { path: "/app/frameworks/new", expectText: "Create Framework" },
    { path: "/app/frameworks/import", expectText: "Import" },
    { path: "/app/integrations", expectText: "Integrations" },
    { path: "/app/admin", expectText: "Admin" },
    { path: "/app/settings", expectText: "Settings" },
    { path: "/app/content-studio", expectText: "Content" },
    { path: "/app/live-coach", expectText: "Live" },
    { path: "/app/white-label", expectText: "White Label" },
  ]

  for (const r of routes) {
    const startedAt = Date.now()
    const label = r.path
    try {
      await page.goto(r.path, { waitUntil: "domcontentloaded" })
      // Give client-side data fetching time to settle to avoid false-positive
      // "Failed to fetch" noise from in-flight requests during rapid navigation.
      await page.waitForLoadState("networkidle").catch(() => {})
      await page.waitForTimeout(500)

      const bodyText = await page.locator("body").innerText()
      const ok = r.expectText ? bodyText.toLowerCase().includes(r.expectText.toLowerCase()) : true

      const shot = path.join(outDir, `${safeSlug(r.path)}.png`)
      await page.screenshot({ path: shot, fullPage: true })

      results.push({ route: label, ok, ms: Date.now() - startedAt, screenshot: shot })
    } catch (e) {
      const shot = path.join(outDir, `${safeSlug(r.path)}_error.png`)
      await page.screenshot({ path: shot, fullPage: true }).catch(() => {})
      results.push({ route: label, ok: false, ms: Date.now() - startedAt, error: String(e), screenshot: shot })
    }
  }

  await browser.close()
  process.stdout.write(
    JSON.stringify(
      {
        baseURL,
        results,
        pageErrors: pageErrors.slice(0, 25),
        consoleErrors: consoleErrors.slice(0, 25),
      },
      null,
      2,
    ) + "\n",
  )
}

await main()
