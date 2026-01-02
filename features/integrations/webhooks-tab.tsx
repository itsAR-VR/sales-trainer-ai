"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, TestTube, Webhook, MoreHorizontal, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { EmptyState } from "@/components/empty-state"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface WebhookSubscription {
  id: string
  url: string
  events: string[]
  enabled: boolean
  secret: string
  createdAt: string
  lastTriggeredAt: string | null
  lastStatus: "success" | "failed" | null
}

const availableEvents = [
  { id: "call.created", label: "Call Created", description: "When a new call is registered" },
  { id: "call.completed", label: "Call Completed", description: "When a call finishes processing" },
  { id: "call.failed", label: "Call Failed", description: "When call processing fails" },
  { id: "framework.updated", label: "Framework Updated", description: "When a framework is modified" },
  { id: "client.created", label: "Client Created", description: "When a new client is added" },
]

export function WebhooksTab() {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newUrl, setNewUrl] = useState("")
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  useEffect(() => {
    fetch("/api/integrations/webhooks")
      .then((r) => r.json())
      .then((json) => setWebhooks(json.data as WebhookSubscription[]))
      .catch((e) =>
        toast({ title: "Failed to load webhooks", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
      )
  }, [toast])

  const handleCreateWebhook = async () => {
    const res = await fetch("/api/integrations/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newUrl, events: selectedEvents }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({ title: "Webhook create failed", description: json?.error?.message ?? "Unknown error", variant: "destructive" })
      return
    }
    const wh = json.data as WebhookSubscription
    setWebhooks((prev) => [wh, ...prev])
    setNewUrl("")
    setSelectedEvents([])
    setIsCreateOpen(false)
    toast({ title: "Webhook created", description: "Your webhook subscription has been created." })
  }

  const handleDeleteWebhook = async (id: string) => {
    await fetch(`/api/integrations/webhooks/${id}`, { method: "DELETE" })
    setWebhooks((prev) => prev.filter((wh) => wh.id !== id))
    toast({ title: "Webhook deleted", description: "The webhook subscription has been removed." })
  }

  const handleToggleWebhook = async (id: string, enabled: boolean) => {
    await fetch(`/api/integrations/webhooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    })
    setWebhooks((prev) => prev.map((wh) => (wh.id === id ? { ...wh, enabled } : wh)))
  }

  const handleTestWebhook = (webhook: WebhookSubscription) => {
    toast({
      title: "Test webhook sent",
      description: `A test event was sent to ${webhook.url}`,
    })
  }

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Webhooks</CardTitle>
            <CardDescription>Receive real-time notifications when events occur</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>Subscribe to events and receive notifications at your endpoint</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Endpoint URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://api.example.com/webhooks"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Events</Label>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {availableEvents.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted">
                        <Checkbox
                          id={event.id}
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={() => toggleEvent(event.id)}
                        />
                        <div className="grid gap-1.5 leading-none">
                          <label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                            {event.label}
                          </label>
                          <p className="text-xs text-muted-foreground">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateWebhook} disabled={!newUrl || selectedEvents.length === 0}>
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {webhooks.length === 0 ? (
          <EmptyState
            icon={Webhook}
            title="No webhooks"
            description="Create a webhook to receive real-time event notifications"
            action={
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Webhook
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Endpoint</TableHead>
                <TableHead>Events</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id}>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded break-all">{webhook.url}</code>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 2).map((event) => (
                        <Badge key={event} variant="secondary" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                      {webhook.events.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{webhook.events.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {webhook.lastStatus === "success" ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-xs">Success</span>
                      </div>
                    ) : webhook.lastStatus === "failed" ? (
                      <div className="flex items-center gap-1 text-destructive">
                        <XCircle className="h-4 w-4" />
                        <span className="text-xs">Failed</span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Never triggered</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {webhook.lastTriggeredAt ? formatDate(webhook.lastTriggeredAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={webhook.enabled}
                      onCheckedChange={(enabled) => handleToggleWebhook(webhook.id, enabled)}
                    />
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleTestWebhook(webhook)}>
                          <TestTube className="mr-2 h-4 w-4" />
                          Send Test
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteWebhook(webhook.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
