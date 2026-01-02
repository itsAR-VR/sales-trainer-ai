"use client"

import { useEffect, useState } from "react"
import { RefreshCw, Eye, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { CodeBlock } from "@/components/code-block"
import { formatDate } from "@/lib/utils"

interface WebhookEvent {
  id: string
  eventType: string
  url: string
  status: "delivered" | "failed" | "pending"
  statusCode: number | null
  attempts: number
  createdAt: string
  payload: object
  response: string | null
}

export function WebhookEventsTab() {
  const [events, setEvents] = useState<WebhookEvent[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedEvent, setSelectedEvent] = useState<WebhookEvent | null>(null)

  const load = () =>
    fetch("/api/admin/webhook-events")
      .then((r) => r.json())
      .then((json) => setEvents(json.data as WebhookEvent[]))

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const filteredEvents = events.filter((event) => statusFilter === "all" || event.status === statusFilter)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Webhook Events</CardTitle>
              <CardDescription>Monitor webhook delivery status and retry failed events</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  load().catch(() => {})
                }}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event Type</TableHead>
                <TableHead>Endpoint</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <Badge variant="outline">{event.eventType}</Badge>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">{event.url.substring(0, 40)}...</code>
                  </TableCell>
                  <TableCell>
                    {event.status === "delivered" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">{event.statusCode}</span>
                      </div>
                    ) : event.status === "failed" ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">{event.statusCode}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-xs">Pending</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{event.attempts}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(event.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setSelectedEvent(event)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
            <DialogDescription>
              {selectedEvent?.eventType} - {selectedEvent?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Request Payload</h4>
                <CodeBlock code={JSON.stringify(selectedEvent.payload, null, 2)} language="json" />
              </div>
              {selectedEvent.response && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Response</h4>
                  <CodeBlock code={selectedEvent.response} language="json" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
