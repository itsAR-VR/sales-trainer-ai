import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { VideoPlayerCard } from "@/components/video-player-card"
import { TranscriptViewer } from "@/components/transcript-viewer"
import { api } from "@/lib/api"
import { formatDate, formatDuration } from "@/lib/utils"

export default async function EmbedCallPage({
  params,
}: {
  params: Promise<{ callId: string }>
}) {
  const { callId } = await params
  const call = await api.calls.getById(callId)

  if (!call) {
    notFound()
  }

  const videoAsset = call.mediaAssets?.find((a) => a.type === "video")

  return (
    <div className="container max-w-5xl py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{call.title}</h1>
          <StatusBadge status={call.status} type="call" />
        </div>
        <p className="text-muted-foreground">
          {formatDate(call.scheduledAt)} • {formatDuration(call.durationSeconds || 0)}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {videoAsset && (
            <VideoPlayerCard
              src={videoAsset.url || ""}
              title="Call Recording"
              metadata={[{ label: "Duration", value: formatDuration(call.durationSeconds || 0) }]}
            />
          )}

          {call.summary && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{call.summary}</p>
              </CardContent>
            </Card>
          )}

          {call.actionItems && call.actionItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Action Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {call.actionItems.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {index + 1}
                      </span>
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="transcript">
          <Card>
            <CardContent className="pt-6">
              {call.transcript ? (
                <TranscriptViewer segments={call.transcript} />
              ) : (
                <p className="text-muted-foreground text-center py-8">No transcript available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">Powered by MaxOut.ai</div>
    </div>
  )
}
