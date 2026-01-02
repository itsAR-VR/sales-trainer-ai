import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Timeline, type TimelineItem } from "@/components/timeline"
import { api } from "@/lib/api"
import { formatDate, getInitials } from "@/lib/utils"

export default async function EmbedClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>
}) {
  const { clientId } = await params
  const client = await api.clients.getById(clientId)

  if (!client) {
    notFound()
  }

  const calls = await api.calls.list()
  const clientCalls = calls.filter((c) => c.clientId === clientId)

  const timelineItems: TimelineItem[] = clientCalls.map((call) => ({
    id: call.id,
    title: call.title,
    description: call.summary || "No summary available",
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
              <p className="text-2xl font-bold">{client.callCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Call</p>
              <p className="text-2xl font-bold">{client.lastCallAt ? formatDate(client.lastCallAt) : "Never"}</p>
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
