import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import type { FrameworkScore } from "@/lib/types"
import { cn } from "@/lib/utils"

interface FrameworkCoverageProps {
  score: FrameworkScore
  className?: string
}

export function FrameworkCoverage({ score, className }: FrameworkCoverageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {/* Overall Score */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{score.frameworkName}</CardTitle>
            <Badge variant="secondary" className="text-lg font-bold">
              {score.overallScore}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={score.overallScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Phase Scores */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Phase Coverage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {score.phaseScores.map((phase) => (
            <div key={phase.phaseId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{phase.phaseName}</span>
                <span className="text-muted-foreground">
                  {phase.coveredQuestions}/{phase.totalQuestions} questions ({phase.score}%)
                </span>
              </div>
              <Progress value={phase.score} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Missed Questions */}
      {score.missedQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              Missed Questions ({score.missedQuestions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {score.missedQuestions.map((q) => (
                <li key={q.questionId} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="shrink-0 mt-0.5">
                    {q.phaseName}
                  </Badge>
                  <span className="text-muted-foreground">{q.questionText}</span>
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
        <CardContent className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Next Call Agenda</h4>
            <ul className="space-y-1">
              {score.coachingPlan.nextCallAgenda.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">Questions to Ask</h4>
            <ul className="space-y-1">
              {score.coachingPlan.questionsToAsk.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
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
