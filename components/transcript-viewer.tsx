"use client"

import { useState, useMemo } from "react"
import { Search, User, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { TranscriptSegment, SpeakerRole } from "@/lib/types"

interface TranscriptViewerProps {
  segments: TranscriptSegment[]
  onTimeClick?: (timeMs: number) => void
  className?: string
}

const roleColors: Record<SpeakerRole, string> = {
  rep: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  prospect: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  other: "bg-muted text-muted-foreground",
}

const highlightColors: Record<string, string> = {
  objection: "border-l-red-500 bg-red-50 dark:bg-red-950/30",
  question: "border-l-blue-500 bg-blue-50 dark:bg-blue-950/30",
  commitment: "border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30",
  pain_point: "border-l-amber-500 bg-amber-50 dark:bg-amber-950/30",
}

export function TranscriptViewer({ segments, onTimeClick, className }: TranscriptViewerProps) {
  const [search, setSearch] = useState("")

  const filteredSegments = useMemo(() => {
    if (!search) return segments
    const searchLower = search.toLowerCase()
    return segments.filter(
      (s) => s.text.toLowerCase().includes(searchLower) || s.speakerName.toLowerCase().includes(searchLower),
    )
  }, [segments, search])

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  return (
    <div className={cn("flex flex-col", className)}>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transcript..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Segments */}
      <ScrollArea className="flex-1">
        <div className="space-y-4 pr-4">
          {filteredSegments.map((segment) => (
            <div
              key={segment.id}
              className={cn(
                "rounded-lg border-l-4 p-4 transition-colors",
                segment.isHighlight && segment.highlightType
                  ? highlightColors[segment.highlightType]
                  : "border-l-transparent bg-muted/30",
              )}
            >
              {/* Header */}
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{segment.speakerName}</span>
                  <Badge variant="secondary" className={cn("text-xs", roleColors[segment.speakerRole])}>
                    {segment.speakerRole}
                  </Badge>
                  {segment.isHighlight && segment.highlightType && (
                    <Badge variant="outline" className="text-xs capitalize">
                      {segment.highlightType.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <button
                  onClick={() => onTimeClick?.(segment.startMs)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  <Clock className="h-3 w-3" />
                  {formatTime(segment.startMs)}
                </button>
              </div>

              {/* Text */}
              <p className="text-sm leading-relaxed">{segment.text}</p>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}
