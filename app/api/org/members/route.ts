import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { mapMembershipRole } from "@/src/lib/ui/mappers"

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const members = await prisma.membership.findMany({
    where: { orgId: ctx.org.id },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  })

  return NextResponse.json({
    data: members.map((m) => ({
      id: m.id,
      name: m.user.name ?? m.user.email,
      email: m.user.email,
      role: mapMembershipRole(m.role),
      joinedAt: m.createdAt.toISOString(),
      lastActiveAt: null,
    })),
  })
}

