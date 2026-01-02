import { notFound } from "next/navigation"
import Link from "next/link"
import { Copy, Edit, MoreHorizontal, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { formatDate } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiFramework } from "@/src/lib/ui/mappers"

export default async function FrameworkDetailPage({
  params,
}: {
  params: Promise<{ frameworkId: string }>
}) {
  const { frameworkId } = await params
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

  const calls = await prisma.call.findMany({
    where: { orgId: ctx.org.id, frameworkVersion: { frameworkId } },
    select: { frameworkScores: { take: 1, orderBy: { createdAt: "desc" }, select: { payloadJson: true } } },
  })
  const overallScores = calls
    .map((c) => (c.frameworkScores[0]?.payloadJson as any)?.overallScore)
    .filter((n): n is number => typeof n === "number")
  const avgCoverage = overallScores.length ? Math.round(overallScores.reduce((a, b) => a + b, 0) / overallScores.length) : 0
  const callCount = calls.length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={framework.name}
        description={framework.description || "No description provided"}
        breadcrumbs={[{ label: "Frameworks", href: "/app/frameworks" }, { label: framework.name }]}
        actions={
          <div className="flex items-center gap-2">
            {framework.activeVersionId ? (
              <Button variant="outline" asChild>
                <Link href={`/app/frameworks/${frameworkId}/versions/${framework.activeVersionId}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Active Version
                </Link>
              </Button>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Copy className="mr-2 h-4 w-4" />
                  Duplicate Framework
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Framework
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        }
      />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Calls</CardDescription>
            <CardTitle className="text-3xl">{callCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Coverage</CardDescription>
            <CardTitle className="text-3xl">{avgCoverage}%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Versions</CardDescription>
            <CardTitle className="text-3xl">{framework.versions?.length || 0}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Versions</CardTitle>
              <CardDescription>Manage framework versions. Only one version can be active at a time.</CardDescription>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Version
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Phases</TableHead>
                <TableHead>Questions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {framework.versions?.map((version) => {
                const questionCount = version.phases.reduce((acc, phase) => acc + phase.questions.length, 0)
                return (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">v{version.versionNumber}</TableCell>
                    <TableCell>
                      {version.id === framework.activeVersionId ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Archived</Badge>
                      )}
                    </TableCell>
                    <TableCell>{version.phases.length}</TableCell>
                    <TableCell>{questionCount}</TableCell>
                    <TableCell>{formatDate(version.createdAt)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/app/frameworks/${frameworkId}/versions/${version.id}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          {version.id !== framework.activeVersionId && (
                            <DropdownMenuItem>Set as Active</DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Version Structure</CardTitle>
          <CardDescription>Current phases and questions in the active framework version</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {framework.versions
              ?.find((v) => v.id === framework.activeVersionId)
              ?.phases.map((phase, index) => (
                <div key={phase.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{phase.name}</h4>
                      {phase.objective && <p className="text-sm text-muted-foreground">{phase.objective}</p>}
                    </div>
                  </div>
                  <div className="ml-11 space-y-2">
                    {phase.questions.map((question) => (
                      <div key={question.id} className="flex items-start gap-3 rounded-lg border p-3">
                        <div className="flex-1">
                          <p className="text-sm">{question.text}</p>
                          {question.tags && question.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {question.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {question.weight}x
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
