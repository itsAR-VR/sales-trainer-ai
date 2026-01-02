import { Suspense } from "react"
import Link from "next/link"
import { PageHeader } from "@/components/page-header"
import { FrameworksContent } from "@/features/frameworks/frameworks-content"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"
import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"

export default function FrameworksPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Frameworks"
        description="Manage your sales methodology frameworks"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/app/frameworks/import">
                <Upload className="mr-2 h-4 w-4" />
                Import
              </Link>
            </Button>
            <Button asChild>
              <Link href="/app/frameworks/new">
                <Plus className="mr-2 h-4 w-4" />
                New Framework
              </Link>
            </Button>
          </>
        }
      />
      <Suspense fallback={<TableSkeleton rows={4} columns={5} />}>
        <FrameworksContent />
      </Suspense>
    </div>
  )
}
