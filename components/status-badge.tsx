import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { CallStatus, ArtifactStatus, JobStatus, WebhookEventStatus } from "@/lib/types"

type StatusType = CallStatus | ArtifactStatus | JobStatus | WebhookEventStatus

const statusConfig: Record<
  StatusType,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className?: string }
> = {
  // Call statuses
  scheduled: { label: "Scheduled", variant: "outline", className: "border-blue-500 text-blue-600 dark:text-blue-400" },
  in_progress: { label: "In Progress", variant: "default", className: "bg-blue-500 text-white" },
  processing: {
    label: "Processing",
    variant: "secondary",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  ready: { label: "Ready", variant: "default", className: "bg-emerald-500 text-white" },
  failed: { label: "Failed", variant: "destructive" },
  // Artifact statuses
  pending: { label: "Pending", variant: "outline", className: "border-muted-foreground text-muted-foreground" },
  downloading: {
    label: "Downloading",
    variant: "secondary",
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  uploaded: {
    label: "Uploaded",
    variant: "secondary",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  },
  verified: { label: "Verified", variant: "default", className: "bg-emerald-500 text-white" },
  deleted_from_recall: {
    label: "Archived",
    variant: "outline",
    className: "border-emerald-500 text-emerald-600 dark:text-emerald-400",
  },
  // Job statuses
  running: { label: "Running", variant: "default", className: "bg-blue-500 text-white" },
  completed: { label: "Completed", variant: "default", className: "bg-emerald-500 text-white" },
  retrying: {
    label: "Retrying",
    variant: "secondary",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  },
  // Webhook event statuses
  delivered: { label: "Delivered", variant: "default", className: "bg-emerald-500 text-white" },
}

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, variant: "outline" as const }

  return (
    <Badge variant={config.variant} className={cn(config.className, className)}>
      {config.label}
    </Badge>
  )
}
