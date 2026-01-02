import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { sha256Hex, randomToken } from "@/src/lib/security/crypto"

const createSchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string().min(1)).min(1),
})

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const keys = await prisma.apiKey.findMany({
    where: { orgId: ctx.org.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json({
    data: keys.map((k) => ({
      id: k.id,
      name: k.name,
      prefix: `maxout_${k.hashedKey.slice(0, 10)}`,
      scopes: k.scopes,
      createdAt: k.createdAt.toISOString(),
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
    })),
  })
}

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = createSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const fullKey = `maxout_${randomToken(24)}`
  const hashedKey = sha256Hex(fullKey)

  const created = await prisma.apiKey.create({
    data: { orgId: ctx.org.id, name: parsed.data.name, hashedKey, scopes: parsed.data.scopes },
  })

  return NextResponse.json({
    data: {
      key: {
        id: created.id,
        name: created.name,
        prefix: `maxout_${hashedKey.slice(0, 10)}`,
        scopes: created.scopes,
        createdAt: created.createdAt.toISOString(),
        lastUsedAt: null,
      },
      fullKey,
    },
  })
}

