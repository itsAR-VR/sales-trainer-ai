import { PageHeader } from "@/components/page-header"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function ClientsLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="View and manage your client relationships" />
      <TableSkeleton rows={6} columns={5} />
    </div>
  )
}
