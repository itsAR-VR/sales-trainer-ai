import type React from "react"
import { AppShell } from "@/components/app-shell"
import { redirect } from "next/navigation"
import { requireOrgContext } from "@/src/lib/auth/context"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) redirect("/login")

  return (
    <AppShell
      viewer={{
        name: ctx.user.name ?? (typeof ctx.supabaseUser.user_metadata?.name === "string" ? ctx.supabaseUser.user_metadata.name : null),
        email: ctx.user.email,
        orgName: ctx.org.name,
      }}
    >
      {children}
    </AppShell>
  )
}
