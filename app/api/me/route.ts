import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { defaultCapabilities } from "@/lib/org-capabilities"

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  return NextResponse.json({
    user: { id: ctx.user.id, email: ctx.user.email, name: ctx.user.name },
    org: {
      id: ctx.org.id,
      name: ctx.org.name,
      slug: ctx.org.slug,
      description: ctx.org.description,
      retentionDays: ctx.org.retentionDays,
    },
    capabilities: defaultCapabilities,
  })
}

