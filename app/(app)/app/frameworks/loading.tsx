import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function FrameworksLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Frameworks" description="Manage your sales methodology frameworks" />
      <TableSkeleton rows={4} columns={5} />
    </div>
  )
}
