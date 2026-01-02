import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function CallsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calls" description="View and manage your recorded calls" />
      <TableSkeleton rows={8} columns={6} />
    </div>
  )
}
