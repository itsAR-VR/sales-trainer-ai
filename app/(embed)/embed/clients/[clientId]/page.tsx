import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Timeline, type TimelineItem } from "@/components/timeline"
import { formatDate, getInitials } from "@/lib/utils"
import { verifyEmbedToken } from "@/src/lib/embeds/tokens"
import { prisma } from "@/lib/prisma"
import { toUiCall } from "@/src/lib/ui/mappers"

export default async function EmbedClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ clientId: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { clientId } = await params
  const { token } = await searchParams
  if (!token) notFound()

  const payload = await verifyEmbedToken(token).catch(() => null)
  if (!payload || payload.scope !== "client" || payload.resourceId !== clientId) notFound()

  const client = await prisma.client.findFirst({
    where: { id: clientId, orgId: payload.orgId },
    include: {
      calls: {
        orderBy: { scheduledAt: "desc" },
        include: { client: true, participants: true, mediaAssets: true, callSummary: true, actionItems: true, frameworkScores: { take: 1, orderBy: { createdAt: "desc" } } },
      },
    },
  })

  if (!client) {
    notFound()
  }

  const clientCalls = client.calls.map(toUiCall)

  const timelineItems: TimelineItem[] = clientCalls.map((call) => ({
    id: call.id,
    title: call.title,
    description: call.summary?.overview || "No summary available",
    timestamp: call.scheduledAt,
    status: call.status === "ready" ? "completed" : call.status === "processing" ? "current" : "pending",
  }))

  return (
    <div className="container max-w-3xl py-6">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(client.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{client.name}</CardTitle>
              {client.email && <p className="text-muted-foreground">{client.email}</p>}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Calls</p>
              <p className="text-2xl font-bold">{client.calls.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Call</p>
              <p className="text-2xl font-bold">
                {client.calls[0]?.scheduledAt ? formatDate(client.calls[0].scheduledAt.toISOString()) : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-4">Call History</h2>

      {timelineItems.length > 0 ? (
        <Timeline items={timelineItems} />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No calls recorded yet</CardContent>
        </Card>
      )}

      <div className="mt-8 pt-6 border-t text-center text-xs text-muted-foreground">Powered by MaxOut.ai</div>
    </div>
  )
}
