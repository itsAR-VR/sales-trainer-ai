import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"

export async function DELETE(_request: Request, context: { params: Promise<{ apiKeyId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { apiKeyId } = await context.params
  await prisma.apiKey.updateMany({ where: { id: apiKeyId, orgId: ctx.org.id }, data: { revokedAt: new Date() } })
  return NextResponse.json({ ok: true })
}

