"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Phone, Mail, Building, Calendar, ExternalLink, Link2 } from "lucide-react"
import type { Client, Call } from "@/lib/types"
import { getClientCalls } from "@/lib/api"

interface ClientDetailContentProps {
  client: Client
}

export function ClientDetailContent({ client }: ClientDetailContentProps) {
  const router = useRouter()
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    getClientCalls(client.id)
      .then(setCalls)
      .finally(() => setIsLoading(false))
  }, [client.id])

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Client Info */}
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contact Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {client.company && (
              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-muted-foreground" />
                {client.company}
              </div>
            )}
            {client.email && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {client.email}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {client.phone}
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Added {new Date(client.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">External References</CardTitle>
              <Button variant="ghost" size="sm">
                <Link2 className="mr-2 h-4 w-4" />
                Link ID
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {client.externalRefs.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {client.externalRefs.map((ref) => (
                  <Badge key={ref} variant="outline">
                    {ref}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No external references linked</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistics</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-2xl font-bold">{client.totalCalls}</p>
              <p className="text-xs text-muted-foreground">Total Calls</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{calls.filter((c) => c.status === "ready").length}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call Timeline */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Call History</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded bg-muted" />
                ))}
              </div>
            ) : calls.length > 0 ? (
              <div className="space-y-4">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    onClick={() => router.push(`/app/calls/${call.id}`)}
                    className="flex items-center justify-between rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <h4 className="font-medium">{call.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(call.scheduledAt).toLocaleDateString()}
                        {call.duration && ` • ${Math.floor(call.duration / 60)}m`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={call.status} />
                      {call.frameworkScore && <Badge variant="secondary">{call.frameworkScore.overallScore}%</Badge>}
                      <Button variant="ghost" size="icon">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Phone}
                title="No calls with this client"
                description="Recorded calls with this client will appear here."
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
