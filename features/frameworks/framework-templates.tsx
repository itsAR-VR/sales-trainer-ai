"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { FrameworkTemplate } from "@/lib/types"
import { createFramework } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface FrameworkTemplatesProps {
  templates: FrameworkTemplate[]
}

export function FrameworkTemplates({ templates }: FrameworkTemplatesProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleInstall = async (template: FrameworkTemplate) => {
    setLoadingId(template.id)
    try {
      const framework = await createFramework({
        name: template.name,
        description: template.description,
        templateId: template.id,
      })
      toast({
        title: "Framework created",
        description: `${template.name} has been added to your frameworks.`,
      })
      router.push(`/app/frameworks/${framework.id}`)
    } finally {
      setLoadingId(null)
    }
  }

  if (templates.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">No templates available</p>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {templates.map((template) => (
        <Card key={template.id} className="relative overflow-hidden">
          {template.category === "popular" && (
            <div className="absolute right-0 top-0">
              <Badge className="rounded-none rounded-bl-lg">
                <Sparkles className="mr-1 h-3 w-3" />
                Popular
              </Badge>
            </div>
          )}
          <CardHeader>
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base">{template.name}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between gap-2">
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  {template.phaseCount} phases
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {template.questionCount} questions
                </Badge>
              </div>
              <Button size="sm" onClick={() => handleInstall(template)} disabled={loadingId === template.id}>
                {loadingId === template.id ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                Use
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
