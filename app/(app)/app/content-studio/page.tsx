import { FileText, ImageIcon, Video } from "lucide-react"
import { PageHeader } from "@/components/page-header"
import { FeatureGate } from "@/components/feature-gate"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ContentStudioPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Content Studio" description="Generate marketing content from your calls" />

      <FeatureGate
        feature="contentStudio"
        fallback={
          <Card className="border-dashed">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Content Studio Coming Soon</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                Transform your call recordings into blog posts, social content, and training materials automatically.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto mt-4">
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <FileText className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Blog Posts</span>
                  <span className="text-xs text-muted-foreground">Long-form content</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Social Media</span>
                  <span className="text-xs text-muted-foreground">Snippets & quotes</span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50">
                  <Video className="h-6 w-6 text-muted-foreground" />
                  <span className="text-sm font-medium">Video Clips</span>
                  <span className="text-xs text-muted-foreground">Highlight reels</span>
                </div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Content Studio Interface</CardTitle>
            <CardDescription>This is where the content generation interface would appear</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Content Studio is enabled for your organization.</p>
          </CardContent>
        </Card>
      </FeatureGate>
    </div>
  )
}
