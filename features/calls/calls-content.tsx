"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, MoreHorizontal, ExternalLink, Download, Copy, Bug, Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Phone } from "lucide-react"
import type { Call, CallStatus } from "@/lib/types"
import { createCall, listCalls } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

const platformIcons: Record<string, string> = {
  zoom: "Z",
  google_meet: "G",
  teams: "T",
  webex: "W",
  other: "?",
}

function formatDuration(seconds?: number): string {
  if (!seconds) return "-"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function CallsContent() {
  const router = useRouter()
  const { toast } = useToast()
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState("")
  const [createMeetingUrl, setCreateMeetingUrl] = useState("")
  const [createPlatform, setCreatePlatform] = useState<string>("zoom")
  const [createRecallBot, setCreateRecallBot] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const loadCalls = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listCalls({
        status: statusFilter !== "all" ? [statusFilter as CallStatus] : undefined,
      })
      setCalls(data)
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadCalls()
  }, [loadCalls])

  const filteredCalls = calls.filter(
    (call) =>
      call.title.toLowerCase().includes(search.toLowerCase()) ||
      call.clientName.toLowerCase().includes(search.toLowerCase()),
  )

  const downloadFromUrl = (url: string) => {
    const a = document.createElement("a")
    a.href = url
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const resetCreateForm = () => {
    setCreateTitle("")
    setCreateMeetingUrl("")
    setCreatePlatform("zoom")
    setCreateRecallBot(true)
  }

  const handleCreateCall = async () => {
    const title = createTitle.trim()
    const meetingUrl = createMeetingUrl.trim()
    if (!title) {
      toast({ title: "Missing title", description: "Please enter a call title.", variant: "destructive" })
      return
    }
    try {
      // Validate early for friendlier UX (server also validates).
      new URL(meetingUrl)
    } catch {
      toast({ title: "Invalid meeting URL", description: "Please enter a valid URL.", variant: "destructive" })
      return
    }

    setIsCreating(true)
    try {
      const created = await createCall({
        title,
        meetingUrl,
        platform: createPlatform,
        createRecallBot,
      })
      await loadCalls()
      setCreateOpen(false)
      resetCreateForm()
      if (created?.id) router.push(`/app/calls/${created.id}`)
      toast({ title: "Call created", description: "Your call is ready and will process as artifacts arrive." })
    } catch (e) {
      toast({
        title: "Failed to create call",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const createCallDialogContent = (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create call</DialogTitle>
        <DialogDescription>Create a call record and (optionally) dispatch a Recall bot.</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="call-title">Title</Label>
          <Input
            id="call-title"
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Demo call"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="call-url">Meeting URL</Label>
          <Input
            id="call-url"
            value={createMeetingUrl}
            onChange={(e) => setCreateMeetingUrl(e.target.value)}
            placeholder="https://zoom.us/j/..."
          />
        </div>

        <div className="space-y-2">
          <Label>Platform</Label>
          <Select value={createPlatform} onValueChange={setCreatePlatform}>
            <SelectTrigger>
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="zoom">Zoom</SelectItem>
              <SelectItem value="google_meet">Google Meet</SelectItem>
              <SelectItem value="teams">Microsoft Teams</SelectItem>
              <SelectItem value="webex">Webex</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <Checkbox checked={createRecallBot} onCheckedChange={(v) => setCreateRecallBot(!!v)} />
          Create Recall bot now
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={isCreating}>
          Cancel
        </Button>
        <Button onClick={handleCreateCall} disabled={isCreating}>
          {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  )

  const getArtifactSummary = (call: Call) => {
    const total = call.mediaAssets.length
    const ready = call.mediaAssets.filter((a) => a.status === "verified" || a.status === "deleted_from_recall").length
    if (total === 0) return null
    return `${ready}/${total}`
  }

  if (!isLoading && calls.length === 0) {
    return (
      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open)
          if (!open) resetCreateForm()
        }}
      >
        <EmptyState
          icon={Phone}
          title="No calls yet"
          description="Your recorded calls will appear here once you start using the meeting bot."
          action={{
            label: "Create call",
            onClick: () => setCreateOpen(true),
          }}
        />
        {createCallDialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog
      open={createOpen}
      onOpenChange={(open) => {
        setCreateOpen(open)
        if (!open) resetCreateForm()
      }}
    >
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search calls..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="ready">Ready</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Create call
              </Button>
            </DialogTrigger>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Artifacts</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCalls.map((call) => (
                <TableRow key={call.id} className="cursor-pointer" onClick={() => router.push(`/app/calls/${call.id}`)}>
                  <TableCell className="font-medium">{call.title}</TableCell>
                  <TableCell>{call.clientName}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {platformIcons[call.platform]}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(call.scheduledAt)}</TableCell>
                  <TableCell>{formatDuration(call.duration)}</TableCell>
                  <TableCell>
                    <StatusBadge status={call.status} />
                  </TableCell>
                  <TableCell>
                    {getArtifactSummary(call) ? (
                      <Badge variant="secondary">{getArtifactSummary(call)}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {call.frameworkScore ? (
                      <Badge
                        variant="secondary"
                        className={cn(
                          call.frameworkScore.overallScore >= 80
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : call.frameworkScore.overallScore >= 60
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                              : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
                        )}
                      >
                        {call.frameworkScore.overallScore}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/app/calls/${call.id}`)
                          }}
                        >
                          <ExternalLink className="mr-2 h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            downloadFromUrl(`/api/calls/${encodeURIComponent(call.id)}/crm-export?download=1`)
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download CRM Export
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation()
                            const link = `${window.location.origin}/app/calls/${call.id}`
                            try {
                              await navigator.clipboard.writeText(link)
                              toast({ title: "Copied link", description: "Call link copied to clipboard." })
                            } catch {
                              toast({ title: "Failed to copy", description: "Could not copy link.", variant: "destructive" })
                            }
                          }}
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Bug className="mr-2 h-4 w-4" />
                          Debug
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {filteredCalls.map((call) => (
            <div
              key={call.id}
              onClick={() => router.push(`/app/calls/${call.id}`)}
              className="rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{call.title}</h3>
                  <p className="text-sm text-muted-foreground">{call.clientName}</p>
                </div>
                <StatusBadge status={call.status} />
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                <span>{formatDate(call.scheduledAt)}</span>
                <span>{formatDuration(call.duration)}</span>
                {call.frameworkScore && <Badge variant="secondary">{call.frameworkScore.overallScore}%</Badge>}
              </div>
            </div>
          ))}
        </div>
      </div>
      {createCallDialogContent}
    </Dialog>
  )
}
