import { NextResponse } from "next/server"
import { z } from "zod"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { createUniqueOrgSlug } from "@/src/lib/auth/slug"

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  retentionDays: z.number().int().min(1).max(365).optional(),
})

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  return NextResponse.json({
    data: {
      id: ctx.org.id,
      name: ctx.org.name,
      slug: ctx.org.slug,
      description: ctx.org.description,
      retentionDays: ctx.org.retentionDays,
      createdAt: ctx.org.createdAt.toISOString(),
    },
  })
}

export async function PATCH(request: Request) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const parsed = patchSchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid body" } }, { status: 400 })

  let slug = parsed.data.slug
  if (slug && slug !== ctx.org.slug) {
    // Ensure uniqueness if user supplies a colliding slug.
    const existing = await prisma.organization.findUnique({ where: { slug }, select: { id: true } })
    if (existing && existing.id !== ctx.org.id) {
      slug = await createUniqueOrgSlug(parsed.data.name ?? ctx.org.name)
    }
  }

  const updated = await prisma.organization.update({
    where: { id: ctx.org.id },
    data: {
      name: parsed.data.name,
      slug,
      description: parsed.data.description,
      retentionDays: parsed.data.retentionDays,
    },
  })

  return NextResponse.json({
    data: {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      retentionDays: updated.retentionDays,
      createdAt: updated.createdAt.toISOString(),
    },
  })
}

