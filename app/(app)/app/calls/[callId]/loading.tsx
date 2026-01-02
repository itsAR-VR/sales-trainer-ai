import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { CardSkeleton } from "@/components/skeletons/card-skeleton"

export default function CallDetailLoading() {
  return (
    <div className="space-y-6">
      <PageHeader title="Loading call..." breadcrumbs={[{ label: "Calls", href: "/app/calls" }, { label: "..." }]} />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <CardSkeleton />
        </div>
        <div className="space-y-6">
          <CardSkeleton lines={10} />
        </div>
      </div>
    </div>
  )
}
