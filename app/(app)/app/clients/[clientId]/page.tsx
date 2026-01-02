import { notFound } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { ClientDetailContent } from "@/features/clients/client-detail-content"
import { getClient } from "@/lib/api"

interface ClientDetailPageProps {
  params: Promise<{ clientId: string }>
}

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params
  const client = await getClient(clientId)

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
