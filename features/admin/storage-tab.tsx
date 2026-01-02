"use client"

import { HardDrive, Video, AudioLines, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const storageByType = [
  { type: "Video Recordings", icon: Video, size: 45.2, unit: "GB", color: "bg-blue-500" },
  { type: "Audio Recordings", icon: AudioLines, size: 12.8, unit: "GB", color: "bg-green-500" },
  { type: "Transcripts", icon: FileText, size: 1.5, unit: "GB", color: "bg-yellow-500" },
  { type: "Analysis Data", icon: HardDrive, size: 0.6, unit: "GB", color: "bg-purple-500" },
]

const largestCalls = [
  { id: "call_abc123", title: "Q4 Planning Session", size: 2.4, date: "2024-01-15" },
  { id: "call_def456", title: "Product Demo - Enterprise", size: 1.8, date: "2024-01-12" },
  { id: "call_ghi789", title: "Team Retrospective", size: 1.5, date: "2024-01-10" },
  { id: "call_jkl012", title: "Client Onboarding", size: 1.2, date: "2024-01-08" },
  { id: "call_mno345", title: "Sales Training", size: 1.1, date: "2024-01-05" },
]

export function StorageTab() {
  const totalUsed = storageByType.reduce((acc, item) => acc + item.size, 0)
  const totalLimit = 100

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Storage Overview</CardTitle>
            <CardDescription>Total storage usage across all data types</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{totalUsed.toFixed(1)} GB</span>
                <span className="text-muted-foreground">of {totalLimit} GB</span>
              </div>
              <Progress value={(totalUsed / totalLimit) * 100} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {((totalUsed / totalLimit) * 100).toFixed(1)}% of storage used
              </p>
            </div>

            <div className="space-y-3">
              {storageByType.map((item) => (
                <div key={item.type} className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${item.color}/10`}>
                    <item.icon className={`h-4 w-4 ${item.color.replace("bg-", "text-")}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.type}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.size} {item.unit}
                      </span>
                    </div>
                    <Progress value={(item.size / totalUsed) * 100} className="h-1.5 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage Actions</CardTitle>
            <CardDescription>Manage your storage usage</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg border space-y-2">
              <h4 className="font-medium">Clean Up Old Recordings</h4>
              <p className="text-sm text-muted-foreground">
                Delete video and audio recordings older than your retention policy
              </p>
              <Button variant="outline" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Run Cleanup
              </Button>
            </div>

            <div className="p-4 rounded-lg border space-y-2">
              <h4 className="font-medium">Export All Data</h4>
              <p className="text-sm text-muted-foreground">
                Download a complete export of all your organization's data
              </p>
              <Button variant="outline" size="sm">
                Request Export
              </Button>
            </div>

            <div className="p-4 rounded-lg border space-y-2">
              <h4 className="font-medium">Upgrade Storage</h4>
              <p className="text-sm text-muted-foreground">Need more space? Upgrade your plan for additional storage</p>
              <Button size="sm">Upgrade Plan</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Largest Calls</CardTitle>
          <CardDescription>Calls consuming the most storage space</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Call</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Size</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {largestCalls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{call.title}</p>
                      <code className="text-xs text-muted-foreground">{call.id}</code>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{call.date}</TableCell>
                  <TableCell>{call.size} GB</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
