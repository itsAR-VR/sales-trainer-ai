import { Check, Clock, AlertCircle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface TimelineStep {
  id: string
  label: string
  status: "completed" | "in_progress" | "failed" | "pending"
  timestamp?: string | null
  error?: string
}

interface TimelineProps {
  steps: TimelineStep[]
  className?: string
}

export function Timeline({ steps, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      {steps.map((step, index) => (
        <div key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={cn(
                "absolute left-[15px] top-8 h-full w-0.5",
                step.status === "completed" ? "bg-emerald-500" : "bg-muted",
              )}
            />
          )}

          {/* Icon */}
          <div
            className={cn(
              "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2",
              step.status === "completed" && "border-emerald-500 bg-emerald-500 text-white",
              step.status === "in_progress" && "border-blue-500 bg-blue-500 text-white",
              step.status === "failed" && "border-destructive bg-destructive text-destructive-foreground",
              step.status === "pending" && "border-muted-foreground/30 bg-background text-muted-foreground",
            )}
          >
            {step.status === "completed" && <Check className="h-4 w-4" />}
            {step.status === "in_progress" && <Loader2 className="h-4 w-4 animate-spin" />}
            {step.status === "failed" && <AlertCircle className="h-4 w-4" />}
            {step.status === "pending" && <Clock className="h-4 w-4" />}
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col gap-1 pt-1">
            <p className={cn("text-sm font-medium", step.status === "pending" && "text-muted-foreground")}>
              {step.label}
            </p>
            {step.timestamp && (
              <p className="text-xs text-muted-foreground">{new Date(step.timestamp).toLocaleString()}</p>
            )}
            {step.error && <p className="text-xs text-destructive">{step.error}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}
