"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, FileText, Sparkles, Check, ChevronRight, Loader2, Save } from "lucide-react"
import type { FrameworkVersion } from "@/lib/types"
import {
  uploadFrameworkDocument,
  getExtractedText,
  generateFrameworkDraft,
  createFramework,
  saveFrameworkVersionDraft,
} from "@/lib/api"

type Step = "upload" | "extract" | "draft" | "review"

export default function ImportFrameworkPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [isLoading, setIsLoading] = useState(false)
  const [extractionId, setExtractionId] = useState<string>("")
  const [extractedText, setExtractedText] = useState<string>("")
  const [ocrRequired, setOcrRequired] = useState(false)
  const [draftFramework, setDraftFramework] = useState<FrameworkVersion | null>(null)
  const [promptViewText, setPromptViewText] = useState<string>("")
  const [dragActive, setDragActive] = useState(false)
  const [frameworkName, setFrameworkName] = useState("")

  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "extract", label: "Extract" },
    { key: "draft", label: "Draft" },
    { key: "review", label: "Review" },
  ]

  const handleFileUpload = async (file: File) => {
    setIsLoading(true)
    try {
      const { extractionId, ocrRequired } = await uploadFrameworkDocument(file)
      setExtractionId(extractionId)
      setOcrRequired(!!ocrRequired)
      if (!ocrRequired) {
        const text = await getExtractedText(extractionId)
        setExtractedText(text)
      } else {
        setExtractedText("")
      }
      setStep("extract")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateDraft = async () => {
    setIsLoading(true)
    try {
      const { version, promptViewText } = await generateFrameworkDraft(extractionId)
      setDraftFramework(version)
      setPromptViewText(promptViewText)
      setStep("draft")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFramework = async () => {
    if (!draftFramework || !frameworkName) return
    setIsLoading(true)
    try {
      const framework = await createFramework({
        name: frameworkName,
        description: `Imported from document on ${new Date().toLocaleDateString()}`,
      })
      await saveFrameworkVersionDraft(framework.id, draftFramework)
      setStep("review")
      setTimeout(() => {
        router.push(`/app/frameworks/${framework.id}`)
      }, 1500)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const currentStepIndex = steps.findIndex((s) => s.key === step)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Framework"
        description="Upload a document to extract a sales framework"
        breadcrumbs={[{ label: "Frameworks", href: "/app/frameworks" }, { label: "Import" }]}
      />

      {/* Stepper */}
      <nav className="flex items-center justify-center">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium ${
                  i < currentStepIndex
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : i === currentStepIndex
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted text-muted-foreground"
                }`}
              >
                {i < currentStepIndex ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${i <= currentStepIndex ? "text-foreground" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <ChevronRight className="mx-4 h-4 w-4 text-muted-foreground" />}
          </div>
        ))}
      </nav>

      {/* Step Content */}
      <Card className="max-w-3xl mx-auto">
        <CardContent className="pt-6">
          {step === "upload" && (
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive ? "border-primary bg-primary/5" : "border-muted"
              }`}
              onDragOver={(e) => {
                e.preventDefault()
                setDragActive(true)
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">Upload Document</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Drag & drop a PDF, DOCX, or Markdown file, or click to browse
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <Badge variant="outline">PDF</Badge>
                <Badge variant="outline">DOCX</Badge>
                <Badge variant="outline">MD</Badge>
              </div>
              <label className="mt-6 inline-block">
                <input
                  type="file"
                  className="sr-only"
                  accept=".pdf,.docx,.md"
                  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                />
                <Button variant="outline" className="cursor-pointer bg-transparent" disabled={isLoading} asChild>
                  <span>
                    {isLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="mr-2 h-4 w-4" />
                    )}
                    Select File
                  </span>
                </Button>
              </label>
            </div>
          )}

          {step === "extract" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Extracted Text</h3>
                <p className="text-sm text-muted-foreground">Review the extracted content from your document</p>
              </div>
              {ocrRequired ? (
                <Alert>
                  <AlertTitle>OCR required</AlertTitle>
                  <AlertDescription>
                    This document appears to be scanned or image-based. OCR isn't implemented yet, so text extraction is empty.
                  </AlertDescription>
                </Alert>
              ) : null}
              <div className="max-h-[400px] overflow-y-auto rounded-lg border bg-muted p-4">
                <pre className="whitespace-pre-wrap text-sm">{extractedText}</pre>
              </div>
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Upload Different File
                </Button>
                <Button onClick={handleGenerateDraft} disabled={isLoading || ocrRequired}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                  )}
                  Generate Draft Framework
                </Button>
              </div>
            </div>
          )}

          {step === "draft" && draftFramework && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold">Generated Framework Draft</h3>
                <p className="text-sm text-muted-foreground">Review the AI-generated framework structure and save it</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="framework-name">Framework Name</Label>
                <Input
                  id="framework-name"
                  value={frameworkName}
                  onChange={(e) => setFrameworkName(e.target.value)}
                  placeholder="e.g., Enterprise Discovery Framework"
                />
              </div>

              <div className="space-y-4">
                {draftFramework.phases.map((phase, index) => (
                  <Card key={phase.id}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <CardTitle className="text-base">{phase.name}</CardTitle>
                          {phase.objective && <CardDescription className="text-xs">{phase.objective}</CardDescription>}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {phase.questions.map((q) => (
                          <li key={q.id} className="flex items-start gap-2 text-sm">
                            <span className="text-muted-foreground">•</span>
                            <span>{q.text}</span>
                            {q.required && (
                              <Badge variant="secondary" className="text-xs">
                                Required
                              </Badge>
                            )}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <details className="rounded-lg border p-4 bg-muted/20">
                <summary className="cursor-pointer text-sm font-medium">Advanced: prompt view</summary>
                <div className="mt-3 max-h-[280px] overflow-auto rounded-md bg-muted p-3">
                  <pre className="whitespace-pre-wrap text-xs">{promptViewText}</pre>
                </div>
              </details>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep("extract")}>
                  Back to Extract
                </Button>
                <Button onClick={handleSaveFramework} disabled={isLoading || !frameworkName}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Framework
                </Button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="text-center py-12">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold">Framework Created!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your framework has been saved. Redirecting to the framework page...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
