"use client"

import type React from "react"

import { Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface FeatureGateProps {
  feature: string
  description: string
  children: React.ReactNode
  isEnabled?: boolean
  className?: string
}

export function FeatureGate({ feature, description, children, isEnabled = false, className }: FeatureGateProps) {
  if (isEnabled) {
    return <>{children}</>
  }

  return (
    <div className={cn("relative", className)}>
      {/* Blurred/disabled content */}
      <div className="pointer-events-none select-none opacity-30 blur-sm">{children}</div>

      {/* Overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{feature}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <Button className="mt-4" disabled>
              <Sparkles className="mr-2 h-4 w-4" />
              Coming Soon in V2
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
