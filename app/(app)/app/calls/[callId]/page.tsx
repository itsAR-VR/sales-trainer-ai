import { Suspense } from "react"
import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { CallDetailContent } from "@/features/calls/call-detail-content"
import { CardSkeleton } from "@/components/skeletons/card-skeleton"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiCall } from "@/src/lib/ui/mappers"

interface CallDetailPageProps {
  params: Promise<{ callId: string }>
}

export default async function CallDetailPage({ params }: CallDetailPageProps) {
  const { callId } = await params
  const ctx = await requireOrgContext()
  if (!ctx.ok) notFound()

  const callRow = await prisma.call.findFirst({
    where: { id: callId, orgId: ctx.org.id },
    include: {
      client: true,
      participants: true,
      mediaAssets: true,
      callSummary: true,
      actionItems: true,
      frameworkScores: { take: 1, orderBy: { createdAt: "desc" } },
    },
  })
  const call = callRow ? toUiCall(callRow) : null

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
