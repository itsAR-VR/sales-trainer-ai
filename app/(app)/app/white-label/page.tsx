import { Palette, Globe, Building } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { FeatureGate } from "@/components/feature-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WhiteLabelPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="White Label" description="Customize branding for your organization" />

      <FeatureGate
        feature="whiteLabel"
        fallback={
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Palette className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>White Label Coming Soon</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Customize the platform with your own branding, colors, and domain for a seamless client experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mt-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Palette className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Custom Branding</span>
                  <span className="text-xs text-muted-foreground">Logo & colors</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Globe className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Custom Domain</span>
                  <span className="text-xs text-muted-foreground">Your own URL</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Building className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Client Portal</span>
                  <span className="text-xs text-muted-foreground">Branded experience</span>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>White Label Settings</CardTitle>
            <CardDescription>This is where white label configuration would appear</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">White label features are enabled for your organization.</p>
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  )
}
