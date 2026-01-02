import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { VideoPlayerCard } from "@/components/video-player-card"
import { TranscriptViewer } from "@/components/transcript-viewer"
import { formatDate, formatDuration } from "@/lib/utils"
import { verifyEmbedToken } from "@/src/lib/embeds/tokens"
import { prisma } from "@/lib/prisma"
import { toUiCall, toUiTranscriptSegments } from "@/src/lib/ui/mappers"
import { getSignedDownloadUrl } from "@/src/lib/storage/s3"

export default async function EmbedCallPage({
  params,
  searchParams,
}: {
  params: Promise<{ callId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { callId } = await params
  const { token } = await searchParams
  if (!token) notFound()

  const payload = await verifyEmbedToken(token).catch(() => null)
  if (!payload || payload.scope !== "call" || payload.resourceId !== callId) notFound()

  const callRow = await prisma.call.findFirst({
    where: { id: callId, orgId: payload.orgId },
    include: {
      client: true,
      participants: true,
      mediaAssets: true,
      callSummary: true,
      actionItems: true,
      frameworkScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })
  const call = callRow ? toUiCall(callRow) : null

  if (!call) {
    notFound()
  }

  const videoAsset = callRow?.mediaAssets.find((a) => a.type === "video_mixed" && a.verifiedAt) ?? null
  const playbackUrl =
    videoAsset ? await getSignedDownloadUrl({ bucket: videoAsset.bucket, key: videoAsset.path, expiresSeconds: 60 * 10 }) : ""

  const segments = await prisma.transcriptSegment.findMany({
    where: { callId },
    select: { id: true, speakerLabel: true, speakerRole: true, startMs: true, endMs: true, text: true },
  })
  const transcript = toUiTranscriptSegments(segments)

  return (
    <div className="container max-w-5xl py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-bold">{call.title}</h1>
          <StatusBadge status={call.status} />
        </div>
        <p className="text-muted-foreground">
          {formatDate(call.scheduledAt)} • {formatDuration(call.duration || 0)}
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="transcript">Transcript</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {playbackUrl && (
            <VideoPlayerCard
              src={playbackUrl}
              title="Call Recording"
              metadata={[{ label: "Duration", value: formatDuration(call.duration || 0) }]}
            />
          )}

          {call.summary?.overview && (
            <Card>
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">{call.summary.overview}</p>
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
                      <span className="text-muted-foreground">{item.text}</span>
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
              {transcript.length ? (
                <TranscriptViewer segments={transcript} />
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
