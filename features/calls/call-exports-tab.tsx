"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CodeBlock } from "@/components/code-block"
import { EmptyState } from "@/components/empty-state"
import { Download, Send, FileText, Copy, Check, ExternalLink } from "lucide-react"
import type { Call, CrmExportPayload } from "@/lib/types"
import { getCrmExportPayload } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface CallExportsTabProps {
  call: Call
}

export function CallExportsTab({ call }: CallExportsTabProps) {
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

  const handleSendToCrm = () => {
    toast({
      title: "CRM Integration",
      description: "CRM integration coming soon. Use the copy button to export manually.",
    })
  }

  const handleDownload = (type: string) => {
    toast({
      title: "Download started",
      description: `Downloading ${type}...`,
    })
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
              <Button size="sm" onClick={handleSendToCrm} disabled={!crmPayload || isLoading}>
                <Send className="mr-2 h-4 w-4" />
                Send to CRM
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

      {/* External Dashboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">External Dashboards</CardTitle>
          <CardDescription>Send call data to connected external systems</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" onClick={() => handleSendToCrm()}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Salesforce
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSendToCrm()}>
            <ExternalLink className="mr-2 h-4 w-4" />
            HubSpot
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleSendToCrm()}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Pipedrive
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
          <Button variant="outline" size="sm" onClick={() => handleDownload("transcript (TXT)")}>
            <Download className="mr-2 h-4 w-4" />
            Transcript (TXT)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("transcript (JSON)")}>
            <Download className="mr-2 h-4 w-4" />
            Transcript (JSON)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("transcript (SRT)")}>
            <Download className="mr-2 h-4 w-4" />
            Subtitles (SRT)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("summary (PDF)")}>
            <Download className="mr-2 h-4 w-4" />
            Summary (PDF)
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDownload("full report (PDF)")}>
            <Download className="mr-2 h-4 w-4" />
            Full Report (PDF)
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
