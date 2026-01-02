import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { publicEnv } from "@/src/lib/env"

export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, publicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options)
        }
      },
    },
  })
}

