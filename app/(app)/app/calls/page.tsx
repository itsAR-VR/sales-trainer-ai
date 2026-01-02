import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { CallsContent } from "@/features/calls/calls-content"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function CallsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calls" description="View and manage your recorded calls" />
      <Suspense fallback={<TableSkeleton rows={8} columns={6} />}>
        <CallsContent />
      </Suspense>
    </div>
  )
}
