import { Suspense } from "react"

import LoginPageClient from "./LoginPageClient"

export const dynamic = "force-dynamic"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">Loading…</div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  )
}
