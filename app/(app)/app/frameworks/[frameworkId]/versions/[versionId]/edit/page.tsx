import { notFound } from "next/navigation"
import { FrameworkBuilder } from "@/features/frameworks/framework-builder"
import { PageHeader } from "@/components/page-header"
import { api } from "@/lib/api"

export default async function EditFrameworkVersionPage({
  params,
}: {
  params: Promise<{ frameworkId: string; versionId: string }>
}) {
  const { frameworkId, versionId } = await params
  const framework = await api.frameworks.getById(frameworkId)

  if (!framework) {
    notFound()
  }

  const version = framework.versions?.find((v) => v.id === versionId)

  if (!version) {
    notFound()
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Edit ${framework.name}`}
        description={`Version ${version.versionNumber}`}
        breadcrumbs={[
          { label: "Frameworks", href: "/app/frameworks" },
          { label: framework.name, href: `/app/frameworks/${frameworkId}` },
          { label: `v${version.versionNumber}` },
        ]}
      />

      <FrameworkBuilder framework={framework} version={version} />
    </div>
  )
}
