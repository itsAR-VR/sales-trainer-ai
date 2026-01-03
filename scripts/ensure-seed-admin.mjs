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
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
  }

  const envPath = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(envPath)) return fromProcess
  const fileEnv = parseDotenv(fs.readFileSync(envPath, "utf8"))

  return {
    NEXT_PUBLIC_SUPABASE_URL: fromProcess.NEXT_PUBLIC_SUPABASE_URL ?? fileEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: fromProcess.SUPABASE_SERVICE_ROLE_KEY ?? fileEnv.SUPABASE_SERVICE_ROLE_KEY,
    SEED_ADMIN_EMAIL: fromProcess.SEED_ADMIN_EMAIL ?? fileEnv.SEED_ADMIN_EMAIL,
    SEED_ADMIN_PASSWORD: fromProcess.SEED_ADMIN_PASSWORD ?? fileEnv.SEED_ADMIN_PASSWORD,
  }
}

async function main() {
  const env = loadEnv()
  const url = env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY
  const email = env.SEED_ADMIN_EMAIL
  const password = env.SEED_ADMIN_PASSWORD

  if (!url || !serviceKey || !email || !password) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD")
  }

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (error) {
    // Treat \"already registered\" as success (idempotent).
    if (/already.*registered/i.test(error.message) || /already exists/i.test(error.message)) {
      process.stdout.write("SEED ADMIN OK: already exists\n")
      return
    }
    throw new Error(`Seed admin create failed: ${error.message}`)
  }

  process.stdout.write("SEED ADMIN OK: created\n")
}

await main()
