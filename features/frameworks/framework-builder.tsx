"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ChevronUp, ChevronDown, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import type { Framework, FrameworkVersion, Phase, Question } from "@/lib/types"

interface FrameworkBuilderProps {
  framework: Framework
  version: FrameworkVersion
}

export function FrameworkBuilder({ framework, version }: FrameworkBuilderProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [phases, setPhases] = useState<Phase[]>(version.phases)
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleAddPhase = () => {
    const newPhase: Phase = {
      id: `phase_${Date.now()}`,
      name: "New Phase",
      order: phases.length,
      questions: [],
    }
    setPhases([...phases, newPhase])
    setIsDirty(true)
  }

  const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
    setPhases(phases.map((p) => (p.id === phaseId ? { ...p, ...updates } : p)))
    setIsDirty(true)
  }

  const handleDeletePhase = (phaseId: string) => {
    setPhases(phases.filter((p) => p.id !== phaseId))
    setIsDirty(true)
  }

  const handleMovePhase = (phaseId: string, direction: "up" | "down") => {
    const index = phases.findIndex((p) => p.id === phaseId)
    if ((direction === "up" && index === 0) || (direction === "down" && index === phases.length - 1)) {
      return
    }

    const newPhases = [...phases]
    const swapIndex = direction === "up" ? index - 1 : index + 1
    ;[newPhases[index], newPhases[swapIndex]] = [newPhases[swapIndex], newPhases[index]]
    setPhases(newPhases.map((p, i) => ({ ...p, order: i })))
    setIsDirty(true)
  }

  const handleAddQuestion = (phaseId: string) => {
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      text: "New question",
      order: 0,
      weight: 1,
    }
    setPhases(
      phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              questions: [...p.questions, { ...newQuestion, order: p.questions.length }],
            }
          : p,
      ),
    )
    setIsDirty(true)
  }

  const handleUpdateQuestion = (phaseId: string, questionId: string, updates: Partial<Question>) => {
    setPhases(
      phases.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              questions: p.questions.map((q) => (q.id === questionId ? { ...q, ...updates } : q)),
            }
          : p,
      ),
    )
    setIsDirty(true)
  }

  const handleDeleteQuestion = (phaseId: string, questionId: string) => {
    setPhases(
      phases.map((p) => (p.id === phaseId ? { ...p, questions: p.questions.filter((q) => q.id !== questionId) } : p)),
    )
    setIsDirty(true)
  }

  const handleMoveQuestion = (phaseId: string, questionId: string, direction: "up" | "down") => {
    setPhases(
      phases.map((p) => {
        if (p.id !== phaseId) return p

        const index = p.questions.findIndex((q) => q.id === questionId)
        if ((direction === "up" && index === 0) || (direction === "down" && index === p.questions.length - 1)) {
          return p
        }

        const newQuestions = [...p.questions]
        const swapIndex = direction === "up" ? index - 1 : index + 1
        ;[newQuestions[index], newQuestions[swapIndex]] = [newQuestions[swapIndex], newQuestions[index]]
        return { ...p, questions: newQuestions.map((q, i) => ({ ...q, order: i })) }
      }),
    )
    setIsDirty(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/frameworks/${framework.id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phases, makeActive: true }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error?.message ?? "Save failed")

      const newVersionId = json.data.versionId as string
      toast({ title: "Framework saved", description: "A new version has been created and activated." })
      setIsDirty(false)
      router.replace(`/app/frameworks/${framework.id}/versions/${newVersionId}/edit`)
      router.refresh()
    } catch (e) {
      toast({ title: "Save failed", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Framework Structure</h2>
          <p className="text-sm text-muted-foreground">Define phases and questions for your sales framework</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleAddPhase}>
            <Plus className="mr-2 h-4 w-4" />
            Add Phase
          </Button>
          <Button onClick={handleSave} disabled={!isDirty || isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={phases.map((p) => p.id)} className="space-y-4">
        {phases.map((phase, phaseIndex) => (
          <AccordionItem key={phase.id} value={phase.id} className="border rounded-lg px-4">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {phaseIndex + 1}
                </div>
                <div className="text-left">
                  <h3 className="font-medium">{phase.name}</h3>
                  <p className="text-xs text-muted-foreground">{phase.questions.length} questions</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Phase Name</Label>
                    <Input value={phase.name} onChange={(e) => handleUpdatePhase(phase.id, { name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Objective (Optional)</Label>
                    <Input
                      value={phase.objective || ""}
                      onChange={(e) => handleUpdatePhase(phase.id, { objective: e.target.value })}
                      placeholder="What should be achieved in this phase?"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Rubric (Optional)</Label>
                  <Textarea
                    value={phase.rubric || ""}
                    onChange={(e) => handleUpdatePhase(phase.id, { rubric: e.target.value })}
                    placeholder="Scoring guidelines for this phase..."
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">Questions</h4>
                  <Button variant="outline" size="sm" onClick={() => handleAddQuestion(phase.id)}>
                    <Plus className="mr-2 h-3 w-3" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-2">
                  {phase.questions.map((question, qIndex) => (
                    <div key={question.id} className="flex items-start gap-2 p-3 rounded-lg border bg-muted/30">
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveQuestion(phase.id, question.id, "up")}
                          disabled={qIndex === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleMoveQuestion(phase.id, question.id, "down")}
                          disabled={qIndex === phase.questions.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={question.text}
                          onChange={(e) =>
                            handleUpdateQuestion(phase.id, question.id, {
                              text: e.target.value,
                            })
                          }
                          placeholder="Question text..."
                        />
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Weight:</Label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={question.weight}
                              onChange={(e) =>
                                handleUpdateQuestion(phase.id, question.id, {
                                  weight: Number.parseInt(e.target.value) || 1,
                                })
                              }
                              className="w-16 h-8"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Label className="text-xs">Tags:</Label>
                            <Input
                              value={question.tags?.join(", ") || ""}
                              onChange={(e) =>
                                handleUpdateQuestion(phase.id, question.id, {
                                  tags: e.target.value
                                    .split(",")
                                    .map((t) => t.trim())
                                    .filter(Boolean),
                                })
                              }
                              placeholder="tag1, tag2"
                              className="h-8"
                            />
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDeleteQuestion(phase.id, question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {phase.questions.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      No questions yet. Add your first question above.
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMovePhase(phase.id, "up")}
                      disabled={phaseIndex === 0}
                    >
                      <ChevronUp className="mr-1 h-3 w-3" />
                      Move Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMovePhase(phase.id, "down")}
                      disabled={phaseIndex === phases.length - 1}
                    >
                      <ChevronDown className="mr-1 h-3 w-3" />
                      Move Down
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive bg-transparent"
                    onClick={() => handleDeletePhase(phase.id)}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete Phase
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {phases.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-medium mb-2">No phases yet</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Start building your framework by adding your first phase
            </p>
            <Button onClick={handleAddPhase}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Phase
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
