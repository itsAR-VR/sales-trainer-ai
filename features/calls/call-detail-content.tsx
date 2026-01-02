"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CallOverviewTab } from "./call-overview-tab"
import { CallTranscriptTab } from "./call-transcript-tab"
import { CallFrameworkTab } from "./call-framework-tab"
import { CallExportsTab } from "./call-exports-tab"
import { CallDebugTab } from "./call-debug-tab"
import type { Call, TranscriptSegment } from "@/lib/types"
import { getCallTranscript, getCallPlaybackUrl } from "@/lib/api"

interface CallDetailContentProps {
  call: Call
}

export function CallDetailContent({ call }: CallDetailContentProps) {
  const [transcript, setTranscript] = useState<TranscriptSegment[]>([])
  const [playbackUrl, setPlaybackUrl] = useState<string>("")
  const [currentTime, setCurrentTime] = useState(0)

  useEffect(() => {
    const loadData = async () => {
      const [transcriptData, url] = await Promise.all([getCallTranscript(call.id), getCallPlaybackUrl(call.id)])
      setTranscript(transcriptData)
      setPlaybackUrl(url)
    }
    loadData()
  }, [call.id])

  const handleTimeClick = (timeMs: number) => {
    // Trigger video seek via global function
    if (typeof window !== "undefined") {
      const win = window as unknown as { seekVideoToTime?: (timeMs: number) => void }
      win.seekVideoToTime?.(timeMs)
    }
  }

  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="transcript">Transcript</TabsTrigger>
        <TabsTrigger value="framework" disabled={!call.frameworkScore}>
          Framework
        </TabsTrigger>
        <TabsTrigger value="exports" disabled={call.status !== "ready"}>
          Exports
        </TabsTrigger>
        <TabsTrigger value="debug">Debug</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-0">
        <CallOverviewTab call={call} playbackUrl={playbackUrl} onTimeUpdate={setCurrentTime} />
      </TabsContent>

      <TabsContent value="transcript" className="space-y-0">
        <CallTranscriptTab transcript={transcript} onTimeClick={handleTimeClick} />
      </TabsContent>

      <TabsContent value="framework" className="space-y-0">
        <CallFrameworkTab call={call} />
      </TabsContent>

      <TabsContent value="exports" className="space-y-0">
        <CallExportsTab call={call} />
      </TabsContent>

      <TabsContent value="debug" className="space-y-0">
        <CallDebugTab call={call} />
      </TabsContent>
    </Tabs>
  )
}
