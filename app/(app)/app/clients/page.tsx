import { Suspense } from "react"
import { PageHeader } from "@/components/page-header"
import { ClientsContent } from "@/features/clients/clients-content"
import { TableSkeleton } from "@/components/skeletons/table-skeleton"

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Clients" description="View and manage your client relationships" />
      <Suspense fallback={<TableSkeleton rows={6} columns={5} />}>
        <ClientsContent />
      </Suspense>
    </div>
  )
}
