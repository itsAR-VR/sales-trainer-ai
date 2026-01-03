"use client"

import { useState } from "react"
import { Code, ExternalLink } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeBlock } from "@/components/code-block"
import { useToast } from "@/hooks/use-toast"

export function EmbedsTab() {
  const { toast } = useToast()
  const [embedType, setEmbedType] = useState<"call" | "client">("call")
  const [resourceId, setResourceId] = useState("")
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto")
  const [embedUrl, setEmbedUrl] = useState<string>("")
  const [snippet, setSnippet] = useState<string>("")

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.maxout.ai"
  const previewUrl = embedUrl || `${baseUrl}/embed/${embedType}s/${resourceId || "{id}"}?token={token}&theme=${theme}`

  const iframeCode = snippet
    ? snippet
    : `<iframe
  src="${previewUrl}"
  width="100%"
  height="600"
  frameborder="0"
  allow="fullscreen"
  style="border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
></iframe>`

  const reactCode = `import { useEffect, useRef } from 'react';

export function MaxOutEmbed({ ${embedType}Id, theme = 'auto' }) {
  const iframeRef = useRef(null);
  
  const src = \`${baseUrl}/embed/${embedType}s/\${${embedType}Id}?token={token}&theme=\${theme}\`;

  return (
    <iframe
      ref={iframeRef}
      src={src}
      width="100%"
      height="600"
      frameBorder="0"
      allow="fullscreen"
      style={{ borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}
    />
  );
}`

  const scriptCode = `<div id="maxout-embed"></div>
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${previewUrl}';
    iframe.width = '100%';
    iframe.height = '600';
    iframe.frameBorder = '0';
    iframe.allow = 'fullscreen';
    iframe.style.borderRadius = '8px';
    iframe.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    document.getElementById('maxout-embed').appendChild(iframe);
  })();
</script>`

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Embed Configuration</CardTitle>
          <CardDescription>Generate embed code to display calls or client timelines on your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Embed Type</Label>
              <Select value={embedType} onValueChange={(v) => setEmbedType(v as "call" | "client")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call Viewer</SelectItem>
                  <SelectItem value="client">Client Timeline</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{embedType === "call" ? "Call ID" : "Client ID"}</Label>
              <Input
                placeholder={embedType === "call" ? "call_abc123" : "client_xyz789"}
                value={resourceId}
                onChange={(e) => {
                  setResourceId(e.target.value)
                  setEmbedUrl("")
                  setSnippet("")
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Theme</Label>
              <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "auto")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Preview URL</Label>
            <div className="flex gap-2">
              <Input value={previewUrl} readOnly className="font-mono text-sm" />
              {embedUrl ? (
                <Button variant="outline" asChild>
                  <a href={embedUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <Button variant="outline" disabled title="Generate a token first">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={!resourceId}
                onClick={async () => {
                  const res = await fetch("/api/integrations/embeds/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ scope: embedType, resourceId, expiresHours: 24 }),
                  })
                  const json = await res.json().catch(() => ({}))
                  if (!res.ok) {
                    toast({ title: "Failed to generate token", description: json?.error?.message ?? "Unknown error", variant: "destructive" })
                    return
                  }
                  setEmbedUrl(json.data.embedUrl as string)
                  setSnippet(json.data.snippet as string)
                }}
              >
                Generate token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Embed Code</CardTitle>
          <CardDescription>Copy the code snippet for your preferred integration method</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="iframe" className="space-y-4">
            <TabsList>
              <TabsTrigger value="iframe">HTML iframe</TabsTrigger>
              <TabsTrigger value="react">React</TabsTrigger>
              <TabsTrigger value="script">Script Tag</TabsTrigger>
            </TabsList>

            <TabsContent value="iframe">
              <CodeBlock code={iframeCode} language="html" />
            </TabsContent>

            <TabsContent value="react">
              <CodeBlock code={reactCode} language="tsx" />
            </TabsContent>

            <TabsContent value="script">
              <CodeBlock code={scriptCode} language="html" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          {embedUrl ? (
            <div className="w-full">
              <div className="text-center mb-6">
                <h3 className="font-medium mb-2">Live Preview</h3>
                <p className="text-sm text-muted-foreground">
                  This preview uses the generated token and will expire based on the selected settings.
                </p>
              </div>
              <iframe
                src={embedUrl}
                title="MaxOut Embed Preview"
                className="w-full rounded-lg border"
                style={{ height: 600 }}
                allow="fullscreen"
              />
            </div>
          ) : (
            <div className="text-center">
              <Code className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-medium mb-2">Live Preview</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Enter a valid {embedType} ID, then generate a token to preview the embed.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
