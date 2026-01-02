import { Suspense } from "react"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { CallDetailContent } from "@/features/calls/call-detail-content"
import { CardSkeleton } from "@/components/skeletons/card-skeleton"
import { getCall } from "@/lib/api"

interface CallDetailPageProps {
  params: Promise<{ callId: string }>
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const { callId } = await params
  const call = await getCall(callId)

  if (!call) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={call.title}
        description={`${call.clientName} • ${call.platform}`}
        breadcrumbs={[{ label: "Calls", href: "/app/calls" }, { label: call.title }]}
      />
      <Suspense
        fallback={
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        }
      >
        <CallDetailContent call={call} />
      </Suspense>
    </div>
  )
}
