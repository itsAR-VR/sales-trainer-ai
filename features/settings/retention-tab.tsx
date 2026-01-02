"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function RetentionTab() {
  const { toast } = useToast()
  const [videoRetention, setVideoRetention] = useState("90")
  const [audioRetention, setAudioRetention] = useState("180")
  const [transcriptRetention, setTranscriptRetention] = useState("forever")
  const [autoDelete, setAutoDelete] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: "Retention policy saved",
      description: "Your data retention settings have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Data Retention</AlertTitle>
        <AlertDescription>
          Configure how long different types of data are retained. Shorter retention periods reduce storage costs but
          limit historical access.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Retention Periods</CardTitle>
          <CardDescription>Set retention periods for different types of call data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Video Recordings</Label>
              <Select value={videoRetention} onValueChange={setVideoRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Video files consume the most storage</p>
            </div>

            <div className="space-y-2">
              <Label>Audio Recordings</Label>
              <Select value={audioRetention} onValueChange={setAudioRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Audio-only files are smaller than video</p>
            </div>

            <div className="space-y-2">
              <Label>Transcripts & Analysis</Label>
              <Select value={transcriptRetention} onValueChange={setTranscriptRetention}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                  <SelectItem value="forever">Forever</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Text data is minimal storage</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border">
            <div className="space-y-0.5">
              <Label>Automatic Deletion</Label>
              <p className="text-sm text-muted-foreground">Automatically delete data when retention period expires</p>
            </div>
            <Switch checked={autoDelete} onCheckedChange={setAutoDelete} />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Policy"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storage Usage</CardTitle>
          <CardDescription>Current storage usage by data type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Video Recordings</span>
                <span className="text-muted-foreground">45.2 GB</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "60%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Audio Recordings</span>
                <span className="text-muted-foreground">12.8 GB</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "17%" }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Transcripts & Analysis</span>
                <span className="text-muted-foreground">2.1 GB</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "3%" }} />
              </div>
            </div>
            <div className="pt-4 border-t flex items-center justify-between">
              <span className="font-medium">Total Storage</span>
              <span className="font-medium">60.1 GB / 100 GB</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
