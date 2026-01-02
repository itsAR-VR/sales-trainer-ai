"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { VideoPlayerCard } from "@/components/video-player-card"
import { Timeline } from "@/components/timeline"
import { StatusBadge } from "@/components/status-badge"
import { User, Calendar, Clock, AlertCircle, CheckCircle2 } from "lucide-react"
import type { Call } from "@/lib/types"

interface CallOverviewTabProps {
  call: Call
  playbackUrl: string
  onTimeUpdate: (time: number) => void
}

const archivalStepLabels: Record<string, string> = {
  recall_complete: "Recording Complete",
  download_started: "Download Started",
  download_complete: "Download Complete",
  upload_complete: "Upload to Storage",
  verified: "Verification Complete",
  recall_deleted: "Recall Cleanup",
}

export function CallOverviewTab({ call, playbackUrl, onTimeUpdate }: CallOverviewTabProps) {
  const timelineSteps = call.archivalSteps.map((step) => ({
    id: step.id,
    label: archivalStepLabels[step.step] || step.step,
    status: step.status,
    timestamp: step.timestamp,
    error: step.error,
  }))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-6">
        {/* Video Player */}
        {call.status === "ready" && playbackUrl ? (
          <VideoPlayerCard src={playbackUrl} title={call.title} onTimeUpdate={onTimeUpdate} />
        ) : (
          <Card>
            <CardContent className="flex aspect-video items-center justify-center">
              <div className="text-center">
                <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  {call.status === "processing"
                    ? "Video is being processed..."
                    : call.status === "failed"
                      ? "Video unavailable"
                      : "Recording not started"}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Card */}
        {call.summary && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm">{call.summary.overview}</p>

              <div>
                <h4 className="mb-2 text-sm font-medium">Key Points</h4>
                <ul className="space-y-1">
                  {call.summary.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium">Next Steps</h4>
                <ul className="space-y-1">
                  {call.summary.nextSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Items */}
        {call.actionItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Action Items</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {call.actionItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-3">
                    <Checkbox checked={item.completed} className="mt-0.5" />
                    <div className="flex-1">
                      <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.text}
                      </p>
                      {(item.assignee || item.dueDate) && (
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          {item.assignee && <span>{item.assignee}</span>}
                          {item.dueDate && <span>Due: {new Date(item.dueDate).toLocaleDateString()}</span>}
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        {/* Call Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {new Date(call.scheduledAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            {call.duration && (
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{Math.floor(call.duration / 60)} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-3">
              <StatusBadge status={call.status} />
            </div>
          </CardContent>
        </Card>

        {/* Participants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Participants</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {call.participants.map((participant) => (
                <li key={participant.id} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{participant.name}</p>
                    {participant.email && <p className="text-xs text-muted-foreground">{participant.email}</p>}
                  </div>
                  <Badge variant="secondary" className="capitalize">
                    {participant.role}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Artifact Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Media Artifacts</CardTitle>
          </CardHeader>
          <CardContent>
            {call.mediaAssets.length > 0 ? (
              <ul className="space-y-3">
                {call.mediaAssets.map((asset) => (
                  <li key={asset.id} className="flex items-center justify-between">
                    <span className="text-sm capitalize">{asset.type.replace("_", " ")}</span>
                    <StatusBadge status={asset.status} />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No artifacts yet</p>
            )}
          </CardContent>
        </Card>

        {/* Archival Timeline */}
        {timelineSteps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Archival Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <Timeline steps={timelineSteps} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
