import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ClientDetailContent } from "@/features/clients/client-detail-content"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params
  const ctx = await requireOrgContext()
  if (!ctx.ok) notFound()

  const clientRow = await prisma.client.findFirst({
    where: { id: clientId, orgId: ctx.org.id },
    include: {
      externalRefs: { select: { systemName: true, externalId: true } },
      calls: { take: 1, orderBy: { scheduledAt: "desc" }, select: { scheduledAt: true } },
      _count: { select: { calls: true } },
    },
  })

  const client = clientRow
    ? {
        id: clientRow.id,
        name: clientRow.name,
        company: clientRow.company ?? undefined,
        email: clientRow.email ?? undefined,
        phone: clientRow.phone ?? undefined,
        externalRefs: clientRow.externalRefs.map((r) => `${r.systemName}:${r.externalId}`),
        totalCalls: clientRow._count.calls,
        lastCallAt: clientRow.calls[0]?.scheduledAt.toISOString(),
        createdAt: clientRow.createdAt.toISOString(),
        updatedAt: clientRow.updatedAt.toISOString(),
      }
    : null

  if (!client) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={client.name}
        description={client.company || client.email}
        breadcrumbs={[{ label: "Clients", href: "/app/clients" }, { label: client.name }]}
      />
      <ClientDetailContent client={client} />
    </div>
  )
}
