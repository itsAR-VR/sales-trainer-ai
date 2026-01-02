import { notFound } from "next/navigation"
import { FrameworkBuilder } from "@/features/frameworks/framework-builder"
import { PageHeader } from "@/components/page-header"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiFramework, toUiFrameworkVersion } from "@/src/lib/ui/mappers"

export default async function EditFrameworkVersionPage({
  params,
}: {
  params: Promise<{ frameworkId: string; versionId: string }>
}) {
  const { frameworkId, versionId } = await params
  const ctx = await requireOrgContext()
  if (!ctx.ok) notFound()

  const frameworkRow = await prisma.framework.findFirst({
    where: { id: frameworkId, orgId: ctx.org.id },
    include: { versions: { include: { phases: { include: { questions: true } } } } },
  })
  const framework = frameworkRow ? toUiFramework(frameworkRow) : null

  if (!framework) {
    notFound()
  }

  const versionRow = frameworkRow?.versions.find((v) => v.id === versionId) ?? null
  const version = versionRow
    ? toUiFrameworkVersion({
        ...versionRow,
        phases: versionRow.phases,
      } as any)
    : null

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
