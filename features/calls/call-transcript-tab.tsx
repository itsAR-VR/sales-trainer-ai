"use client"

import { TranscriptViewer } from "@/components/transcript-viewer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmptyState } from "@/components/empty-state"
import { FileText } from "lucide-react"
import type { TranscriptSegment } from "@/lib/types"

interface CallTranscriptTabProps {
  transcript: TranscriptSegment[]
  onTimeClick: (timeMs: number) => void
}

export function CallTranscriptTab({ transcript, onTimeClick }: CallTranscriptTabProps) {
  if (transcript.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No transcript available"
        description="The transcript will be available once the call recording is processed."
      />
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Full Transcript</CardTitle>
      </CardHeader>
      <CardContent>
        <TranscriptViewer segments={transcript} onTimeClick={onTimeClick} className="max-h-[600px]" />
      </CardContent>
    </Card>
  )
}
