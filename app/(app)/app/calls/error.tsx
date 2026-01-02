"use client"

import { AlertCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function CallsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center p-8">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center p-6 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-lg font-semibold">Failed to load calls</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred while loading your calls."}
          </p>
          <Button onClick={reset} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
