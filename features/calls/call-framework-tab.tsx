"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/empty-state"
import { AlertCircle, CheckCircle2, Layers, ExternalLink } from "lucide-react"
import type { Call } from "@/lib/types"
import { cn } from "@/lib/utils"

interface CallFrameworkTabProps {
  call: Call
}

export function CallFrameworkTab({ call }: CallFrameworkTabProps) {
  const { frameworkScore } = call

  if (!frameworkScore) {
    return (
      <EmptyState
        icon={Layers}
        title="No framework applied"
        description="Apply a framework to this call to see coverage analysis and coaching recommendations."
        action={
          <Button asChild>
            <Link href="/app/frameworks">Browse Frameworks</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{frameworkScore.frameworkName}</CardTitle>
              <Link
                href={`/app/frameworks/${frameworkScore.frameworkId}`}
                className="text-xs text-muted-foreground hover:underline inline-flex items-center gap-1"
              >
                View framework <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <Badge
              variant="secondary"
              className={cn(
                "text-lg font-bold",
                frameworkScore.overallScore >= 80
                  ? "bg-emerald-500/10 text-emerald-600"
                  : frameworkScore.overallScore >= 60
                    ? "bg-amber-500/10 text-amber-600"
                    : "bg-red-500/10 text-red-600",
              )}
            >
              {frameworkScore.overallScore}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress
            value={frameworkScore.overallScore}
            className={cn(
              "h-3",
              frameworkScore.overallScore >= 80
                ? "[&>div]:bg-emerald-500"
                : frameworkScore.overallScore >= 60
                  ? "[&>div]:bg-amber-500"
                  : "[&>div]:bg-red-500",
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Based on coverage of {frameworkScore.phaseScores.length} phases and{" "}
            {frameworkScore.phaseScores.reduce((acc, p) => acc + p.totalQuestions, 0)} questions
          </p>
        </CardContent>
      </Card>

      {/* Phase Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {frameworkScore.phaseScores.map((phase) => (
            <div key={phase.phaseId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{phase.phaseName}</span>
                <span className="text-muted-foreground">
                  {phase.coveredQuestions}/{phase.totalQuestions} questions ({phase.score}%)
                </span>
              </div>
              <Progress
                value={phase.score}
                className={cn(
                  "h-2",
                  phase.score >= 80
                    ? "[&>div]:bg-emerald-500"
                    : phase.score >= 60
                      ? "[&>div]:bg-amber-500"
                      : "[&>div]:bg-red-500",
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Missed Questions */}
      {frameworkScore.missedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Missed Questions ({frameworkScore.missedQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {frameworkScore.missedQuestions.map((q) => (
                <li key={q.questionId} className="flex items-start gap-3">
                  <Badge variant="outline" className="shrink-0 mt-0.5 text-xs">
                    {q.phaseName}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{q.questionText}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Coaching Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Coaching Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="mb-3 text-sm font-medium">Next Call Agenda</h4>
            <ul className="space-y-2">
              {frameworkScore.coachingPlan.nextCallAgenda.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-medium">Questions to Ask Next Time</h4>
            <ul className="space-y-2">
              {frameworkScore.coachingPlan.questionsToAsk.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
