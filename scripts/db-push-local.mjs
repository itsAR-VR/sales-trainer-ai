import { spawnSync } from "node:child_process"

function fail(message) {
  console.error(message)
  process.exit(1)
}

const allow = process.env.ALLOW_DB_PUSH === "true"
if (!allow) {
  fail(
    [
      "Refusing to run `prisma db push`.",
      "This repo is migration-first. Use `pnpm db:migrate` (local) or `pnpm db:deploy` (non-interactive).",
      "",
      "If you *really* need db push for a throwaway LOCAL database, rerun with:",
      "  ALLOW_DB_PUSH=true pnpm db:push",
    ].join("\n"),
  )
}

const databaseUrl = process.env.DATABASE_URL || ""
if (!databaseUrl) fail("DATABASE_URL is required to run db push.")

let host = ""
try {
  host = new URL(databaseUrl).hostname
} catch {
  fail("DATABASE_URL must be a valid connection string.")
}

const isLocalHost = host === "localhost" || host === "127.0.0.1" || host === "postgres"
if (!isLocalHost) {
  fail(
    [
      `Refusing to run db push against non-local host: ${host}`,
      "Migrations are required for preview/prod/shared environments.",
    ].join("\n"),
  )
}

const result = spawnSync("pnpm", ["prisma", "db", "push"], {
  stdio: "inherit",
  env: process.env,
})

process.exit(result.status ?? 1)

