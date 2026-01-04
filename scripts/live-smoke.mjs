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
  // Ensure hydration completes so form handlers are attached.
  await page.waitForLoadState("networkidle")
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

  const callList = calls?.data ?? []
  const callWithoutFramework = callList.find((c) => !c?.frameworkScore)

  let callId = callWithoutFramework?.id ?? callList?.[0]?.id
  let clientId = callWithoutFramework?.clientId ?? clients?.data?.[0]?.id

  // Fresh orgs may have no calls/clients yet. Seed a safe demo call via the API so embeds can be validated.
  if (!callId || !clientId) {
    const demo = await expectOkJson(
      await context.request.post(new URL("/api/calls", baseURL).toString(), {
        data: {
          title: "Demo Call (smoke test)",
          meetingUrl: "https://example.com/meet",
          platform: "zoom",
          createRecallBot: false,
        },
      }),
      "POST /api/calls (seed demo)",
    )

    callId = callId ?? demo?.data?.id
    clientId = clientId ?? demo?.data?.clientId

    if (!clientId) {
      const clientsAfter = await expectOkJson(await context.request.get(new URL("/api/clients", baseURL).toString()), "/api/clients (after seed)")
      clientId = clientsAfter?.data?.[0]?.id
    }
  }

  if (!callId || !clientId) throw new Error("No call/client available after seeding demo data")

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

  // 7) Framework import (PDF) + apply to an example call
  const fixture = path.join(process.cwd(), "test", "fixtures", "framework-example.pdf")
  if (!fs.existsSync(fixture)) {
    throw new Error(`Missing framework PDF fixture at ${fixture}`)
  }

  const frameworkName = `Smoke Framework ${new Date().toISOString()}`

  await page.goto("/app/frameworks/import", { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle")
  await page.setInputFiles('input[type="file"]', fixture)

  await page.getByText("Extracted Text").waitFor({ timeout: 120000 })
  if (await page.getByText("OCR required").isVisible().catch(() => false)) {
    throw new Error("Framework import returned OCR required for the PDF fixture (expected extractable text)")
  }

  const extracted = await page.locator("pre").first().innerText()
  if ((extracted || "").trim().length < 200) {
    throw new Error(`Extracted text too short (${(extracted || "").trim().length} chars)`)
  }

  await Promise.all([
    page.getByText("Generated Framework Draft").waitFor({ timeout: 240000 }),
    page.getByRole("button", { name: "Generate Draft Framework" }).click(),
  ])

  await page.fill("#framework-name", frameworkName)
  const [createFrameworkResp] = await Promise.all([
    page.waitForResponse((resp) => {
      try {
        const u = new URL(resp.url())
        return resp.request().method() === "POST" && u.pathname === "/api/frameworks"
      } catch {
        return false
      }
    }),
    page.getByRole("button", { name: "Save Framework" }).click(),
  ])

  const createdText = await createFrameworkResp.text()
  if (!createFrameworkResp.ok()) {
    throw new Error(`Create framework failed (${createFrameworkResp.status()}): ${createdText.slice(0, 200)}`)
  }
  const createdJson = JSON.parse(createdText)
  const frameworkId = createdJson?.data?.id
  if (!frameworkId) throw new Error("Create framework response missing framework id")

  // Wait for the version save to complete, then navigate to the framework page directly.
  const versionSaveResp = await page.waitForResponse((resp) => {
    try {
      const u = new URL(resp.url())
      return resp.request().method() === "POST" && u.pathname === `/api/frameworks/${frameworkId}/versions`
    } catch {
      return false
    }
  })
  if (!versionSaveResp.ok()) {
    const text = await versionSaveResp.text().catch(() => "")
    throw new Error(`Save framework version failed (${versionSaveResp.status()}): ${text.slice(0, 200)}`)
  }

  await page.goto(`/app/frameworks/${frameworkId}`, { waitUntil: "domcontentloaded" })
  await page.getByText(frameworkName).first().waitFor({ timeout: 120000 })

  await page.goto(`/app/calls/${callId}`, { waitUntil: "domcontentloaded" })
  await page.waitForLoadState("networkidle").catch(() => {})
  await page.getByRole("tab", { name: "Framework" }).click()

  await page.getByRole("button", { name: "Select a framework" }).click()
  await page.getByRole("option", { name: frameworkName }).click()
  await page.getByRole("button", { name: "Apply" }).click()
  await page.getByText("Framework applied").waitFor({ timeout: 30000 })

  await browser.close()
  process.stdout.write("LIVE SMOKE OK: auth redirect + UI login + /api/health + /api/me + /api/admin/storage + embeds + framework import/apply\n")
}

await main()
