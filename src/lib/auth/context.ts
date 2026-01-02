import { createSupabaseServerClient } from "@/lib/supabase/server"
import { ensureAppUserAndOrg } from "@/src/lib/auth/onboarding"

export async function requireOrgContext() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser()

  if (!supabaseUser) {
    return { ok: false as const, status: 401 as const }
  }

  const { user, org, membership } = await ensureAppUserAndOrg(supabaseUser)
  return { ok: true as const, user, org, membership, supabaseUser }
}

