"use client"

import { useEffect, useMemo, useState } from "react"
import { RefreshCw, Trash2, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface Job {
  id: string
  type: string
  status: "pending" | "retrying" | "running" | "completed" | "failed"
  progress: number
  callId: string | null
  attempts: number
  maxAttempts: number
  createdAt: string
  startedAt: string | null
  completedAt: string | null
  error: string | null
}

const statusIcons = {
  pending: <Clock className="h-4 w-4 text-muted-foreground" />,
  retrying: <RefreshCw className="h-4 w-4 text-amber-500" />,
  running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle className="h-4 w-4 text-green-600" />,
  failed: <XCircle className="h-4 w-4 text-destructive" />,
}

export function JobsTab() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<Job[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")

  const load = () =>
    fetch("/api/admin/jobs")
      .then((r) => r.json())
      .then((json) => setJobs(json.data as Job[]))

  useEffect(() => {
    load().catch(() => {})
  }, [])

  const jobTypes = useMemo(() => Array.from(new Set(jobs.map((j) => j.type))).sort(), [jobs])

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false
    if (typeFilter !== "all" && job.type !== typeFilter) return false
    return true
  })

  const handleRetry = async (jobId: string) => {
    await fetch(`/api/admin/jobs/${jobId}/retry`, { method: "POST" })
    await load().catch(() => {})
    toast({ title: "Job queued", description: "The job has been queued for retry." })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Jobs Queue</CardTitle>
            <CardDescription>Monitor and manage background processing jobs</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {jobTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="retrying">Retrying</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
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
              <TableHead>Job</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredJobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell>
                  <div>
                    <code className="text-xs font-medium">{job.id}</code>
                    {job.callId && <p className="text-xs text-muted-foreground">{job.callId}</p>}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {job.type.replace("_", " ")}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {statusIcons[job.status]}
                    <span className="text-sm capitalize">{job.status}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="w-[100px]">
                    <Progress value={job.progress} className="h-2" />
                    <span className="text-xs text-muted-foreground">{job.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {job.attempts} / {job.maxAttempts}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(job.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {job.status === "failed" && job.attempts < job.maxAttempts && (
                      <Button variant="ghost" size="icon" onClick={() => handleRetry(job.id)}>
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    )}
                    {(job.status === "pending" || job.status === "retrying" || job.status === "running") && (
                      <Button variant="ghost" size="icon" disabled>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredJobs.some((j) => j.error) && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-medium">Errors</h4>
            {filteredJobs
              .filter((j) => j.error)
              .map((job) => (
                <div key={job.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <code className="text-xs font-medium text-destructive">{job.id}</code>
                  <p className="text-sm text-destructive mt-1">{job.error}</p>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
