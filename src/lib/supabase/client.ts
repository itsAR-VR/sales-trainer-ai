import { createBrowserClient } from "@supabase/ssr"
import { publicEnv } from "@/src/lib/env"

export function createSupabaseBrowserClient() {
  return createBrowserClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

