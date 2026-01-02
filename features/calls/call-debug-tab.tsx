"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/status-badge"
import { RefreshCw, Loader2 } from "lucide-react"
import type { Call } from "@/lib/types"
import { rerunCallFinalize } from "@/lib/api"

interface CallDebugTabProps {
  call: Call
}

export function CallDebugTab({ call }: CallDebugTabProps) {
  const [webhookEvents, setWebhookEvents] = useState<any[]>([])
  const [jobs, setJobs] = useState<any[]>([])
  const [isRerunning, setIsRerunning] = useState(false)

  useEffect(() => {
    fetch("/api/admin/webhook-events")
      .then((r) => r.json())
      .then((json) => setWebhookEvents((json.data as any[]).slice(0, 10)))
      .catch(() => {})

    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((json) => setJobs((json.data as any[]).filter((job) => job.callId === call.id)))
      .catch(() => {})
  }, [call.id])

  const handleRerun = async () => {
    setIsRerunning(true)
    await rerunCallFinalize(call.id)
    setIsRerunning(false)
  }

  return (
    <div className="space-y-6">
      {/* Call Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Debug Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Call ID</span>
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{call.id}</code>
          </div>
          {call.recallBotId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recall Bot ID</span>
              <code className="rounded bg-muted px-2 py-0.5 font-mono text-xs">{call.recallBotId}</code>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <StatusBadge status={call.status} />
          </div>
        </CardContent>
      </Card>

      {/* Job Attempts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Jobs</CardTitle>
            {call.status === "failed" && (
              <Button variant="outline" size="sm" onClick={handleRerun} disabled={isRerunning}>
                {isRerunning ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Re-run Finalize
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-mono text-xs">{job.type}</TableCell>
                    <TableCell>
                      <StatusBadge status={job.status} />
                    </TableCell>
                    <TableCell>{job.attempts}</TableCell>
                    <TableCell className="text-xs">
                      {job.startedAt ? new Date(job.startedAt).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-destructive">
                      {job.error || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No job attempts recorded</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Webhook Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Webhook Events</CardTitle>
        </CardHeader>
        <CardContent>
          {webhookEvents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhookEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-mono text-xs">{event.eventType}</TableCell>
                    <TableCell>
                      <StatusBadge status={event.status} />
                    </TableCell>
                    <TableCell>{event.attempts}</TableCell>
                    <TableCell className="text-xs">{new Date(event.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No webhook events</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
