import type { User as SupabaseUser } from "@supabase/supabase-js"
import { MembershipRole } from "@prisma/client"
import { prisma } from "@/src/lib/prisma"
import { ensureOrgFrameworkTemplates } from "@/src/lib/frameworks/templateCatalog"
import { createUniqueOrgSlug } from "@/src/lib/auth/slug"

export async function ensureAppUserAndOrg(supabaseUser: SupabaseUser) {
  const email = supabaseUser.email ?? ""
  if (!email) throw new Error("Supabase user missing email")

  const displayName =
    typeof supabaseUser.user_metadata?.name === "string"
      ? (supabaseUser.user_metadata.name as string)
      : typeof supabaseUser.user_metadata?.full_name === "string"
        ? (supabaseUser.user_metadata.full_name as string)
        : undefined

  const user = await prisma.user.upsert({
    where: { supabaseUserId: supabaseUser.id },
    create: { supabaseUserId: supabaseUser.id, email, name: displayName },
    update: { email, name: displayName },
  })

  const existingMembership = await prisma.membership.findFirst({
    where: { userId: user.id },
    include: { org: true },
  })
  if (existingMembership) {
    await ensureOrgFrameworkTemplates(prisma, existingMembership.orgId)
    return { user, org: existingMembership.org, membership: existingMembership }
  }

  const orgName = displayName ? `${displayName}'s Org` : `${email.split("@")[0]}'s Org`
  const slug = await createUniqueOrgSlug(orgName)

  const org = await prisma.organization.create({
    data: { name: orgName, slug },
  })

  const membership = await prisma.membership.create({
    data: { orgId: org.id, userId: user.id, role: MembershipRole.OWNER },
  })

  await ensureOrgFrameworkTemplates(prisma, org.id)
  return { user, org, membership }
}

