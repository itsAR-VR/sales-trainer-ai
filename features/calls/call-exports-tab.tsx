"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/code-block"
import { EmptyState } from "@/components/empty-state"
import { Download, FileText, Copy, Check, Settings } from "lucide-react"
import type { Call, CrmExportPayload } from "@/lib/types"
import { getCrmExportPayload } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CallExportsTabProps {
  call: Call
}

export function CallExportsTab({ call }: CallExportsTabProps) {
  const router = useRouter()
  const [crmPayload, setCrmPayload] = useState<CrmExportPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadPayload() {
      setIsLoading(true)
      try {
        const payload = await getCrmExportPayload(call.id)
        setCrmPayload(payload)
      } catch (error) {
        console.error("Failed to load CRM payload:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadPayload()
  }, [call.id])

  const handleCopyPayload = async () => {
    if (!crmPayload) return
    try {
      await navigator.clipboard.writeText(JSON.stringify(crmPayload, null, 2))
      setCopied(true)
      toast({
        title: "Copied to clipboard",
        description: "CRM payload has been copied to your clipboard.",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      })
    }
  }

  const downloadFromUrl = (url: string) => {
    const a = document.createElement("a")
    a.href = url
    a.rel = "noopener"
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleDownloadCrmJson = () => {
    downloadFromUrl(`/api/calls/${encodeURIComponent(call.id)}/crm-export?download=1`)
  }

  const handleDownloadTranscript = (format: "txt" | "json" | "srt") => {
    downloadFromUrl(`/api/calls/${encodeURIComponent(call.id)}/transcript?format=${format}&download=1`)
  }

  if (call.status !== "ready") {
    return (
      <EmptyState
        icon={FileText}
        title="Exports not available"
        description="Exports will be available once the call is fully processed."
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* CRM Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">CRM Notes Export</CardTitle>
              <CardDescription>Structured data ready for your CRM system</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyPayload} disabled={!crmPayload || isLoading}>
                {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copied ? "Copied" : "Copy JSON"}
              </Button>
              <Button size="sm" onClick={handleDownloadCrmJson} disabled={!crmPayload || isLoading}>
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Loading export data...</p>
            </div>
          ) : crmPayload ? (
            <CodeBlock code={JSON.stringify(crmPayload, null, 2)} language="json" />
          ) : (
            <div className="h-32 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No export data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Integrations</CardTitle>
          <CardDescription>Configure webhooks and API keys for downstream systems</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" size="sm" onClick={() => router.push("/app/integrations")}>
            <Settings className="mr-2 h-4 w-4" />
            Manage integrations
          </Button>
        </CardContent>
      </Card>

      {/* Download Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Download Options</CardTitle>
          <CardDescription>Download call artifacts in various formats</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => handleDownloadTranscript("txt")}>
            <Download className="mr-2 h-4 w-4" />
            Transcript (TXT)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownloadTranscript("json")}>
            <Download className="mr-2 h-4 w-4" />
            Transcript (JSON)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownloadTranscript("srt")}>
            <Download className="mr-2 h-4 w-4" />
            Subtitles (SRT)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
