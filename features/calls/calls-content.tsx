"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Filter, MoreHorizontal, ExternalLink, Download, Copy, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { EmptyState } from "@/components/empty-state"
import { Phone } from "lucide-react"
import type { Call, CallStatus } from "@/lib/types"
import { listCalls } from "@/lib/api"
import { cn } from "@/lib/utils"

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
  const [calls, setCalls] = useState<Call[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    loadCalls()
  }, [statusFilter])

  const loadCalls = async () => {
    setIsLoading(true)
    try {
      const data = await listCalls({
        status: statusFilter !== "all" ? [statusFilter as CallStatus] : undefined,
      })
      setCalls(data)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredCalls = calls.filter(
    (call) =>
      call.title.toLowerCase().includes(search.toLowerCase()) ||
      call.clientName.toLowerCase().includes(search.toLowerCase()),
  )

  const getArtifactSummary = (call: Call) => {
    const total = call.mediaAssets.length
    const ready = call.mediaAssets.filter((a) => a.status === "verified" || a.status === "deleted_from_recall").length
    if (total === 0) return null
    return `${ready}/${total}`
  }

  if (!isLoading && calls.length === 0) {
    return (
      <EmptyState
        icon={Phone}
        title="No calls yet"
        description="Your recorded calls will appear here once you start using the meeting bot."
        action={{
          label: "Learn more",
          onClick: () => {},
        }}
      />
    )
  }

  return (
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
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CRM Notes
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
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
  )
}
