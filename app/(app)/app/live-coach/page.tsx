import { Mic, Radio, Sparkles } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { FeatureGate } from "@/components/feature-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LiveCoachPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Live Coach" description="Real-time coaching assistance during calls" />

      <FeatureGate
        feature="liveCoach"
        fallback={
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Radio className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Live Coaching Coming Soon</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Get real-time suggestions and prompts during your calls. This feature is available in our Pro plan.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mt-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Mic className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Voice Detection</span>
                  <span className="text-xs text-muted-foreground">Real-time speech analysis</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Sparkles className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">AI Suggestions</span>
                  <span className="text-xs text-muted-foreground">Smart coaching prompts</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Radio className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Live Overlay</span>
                  <span className="text-xs text-muted-foreground">Non-intrusive display</span>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Live Coach Interface</CardTitle>
            <CardDescription>This is where the live coaching interface would appear</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Live coaching functionality is enabled for your organization.</p>
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  )
}
