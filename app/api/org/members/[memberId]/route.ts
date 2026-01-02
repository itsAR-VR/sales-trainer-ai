import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { MembershipRole } from "@prisma/client"

const patchSchema = z.object({ role: z.enum(["admin", "member"]) })

export async function PATCH(request: Request, context: { params: Promise<{ memberId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { memberId } = await context.params
  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  const role = parsed.data.role === "admin" ? MembershipRole.ADMIN : MembershipRole.MEMBER
  await prisma.membership.updateMany({ where: { id: memberId, orgId: ctx.org.id }, data: { role } })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_request: Request, context: { params: Promise<{ memberId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { memberId } = await context.params
  await prisma.membership.deleteMany({ where: { id: memberId, orgId: ctx.org.id } })
  return NextResponse.json({ ok: true })
}

