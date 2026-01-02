import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { createEmbedToken } from "@/src/lib/embeds/tokens"
import { publicEnv } from "@/src/lib/env"

const bodySchema = z.object({
  scope: z.enum(["call", "client"]),
  resourceId: z.string().min(1),
  expiresHours: z.number().int().min(1).max(24).default(24),
})

export async function POST(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = bodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const expiresAt = new Date(Date.now() + parsed.data.expiresHours * 60 * 60 * 1000)
  const token = await createEmbedToken({
    orgId: ctx.org.id,
    scope: parsed.data.scope,
    resourceId: parsed.data.resourceId,
    expiresAt,
  })

  const embedUrl = `${publicEnv.NEXT_PUBLIC_APP_URL}/embed/${parsed.data.scope}s/${parsed.data.resourceId}?token=${encodeURIComponent(token)}`
  const snippet = `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allow="fullscreen" style="border-radius: 8px;"></iframe>`

  return NextResponse.json({ data: { token, embedUrl, snippet, expiresAt: expiresAt.toISOString() } })
}

