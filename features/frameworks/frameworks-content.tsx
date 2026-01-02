"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MoreHorizontal, Copy, Trash2, FileText, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { EmptyState } from "@/components/empty-state"
import { FrameworkTemplates } from "./framework-templates"
import { listFrameworks, listFrameworkTemplates } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import type { Framework, FrameworkTemplate } from "@/lib/types"

export function FrameworksContent() {
  const [frameworks, setFrameworks] = useState<Framework[]>([])
  const [templates, setTemplates] = useState<FrameworkTemplate[]>([])
  const [search, setSearch] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      setIsLoading(true)
      try {
        const [fw, tmpl] = await Promise.all([listFrameworks(), listFrameworkTemplates()])
        setFrameworks(fw)
        setTemplates(tmpl)
      } catch (error) {
        console.error("Failed to load frameworks:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredFrameworks = frameworks.filter(
    (fw) =>
      fw.name.toLowerCase().includes(search.toLowerCase()) ||
      fw.description?.toLowerCase().includes(search.toLowerCase()),
  )

  if (isLoading) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Your Frameworks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Your Frameworks</h2>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search frameworks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {filteredFrameworks.length === 0 && !search ? (
          <EmptyState
            icon={FileText}
            title="No frameworks yet"
            description="Create your first framework or import one from a template"
            action={
              <Button asChild>
                <Link href="/app/frameworks/new">Create Framework</Link>
              </Button>
            }
          />
        ) : filteredFrameworks.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No results found"
            description={`No frameworks match "${search}"`}
            action={
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            }
          />
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Phases</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFrameworks.map((framework) => {
                  const activeVersion = framework.versions.find((v) => v.id === framework.activeVersionId)
                  const phaseCount = activeVersion?.phases.length || 0
                  const questionCount =
                    activeVersion?.phases.reduce((acc, phase) => acc + phase.questions.length, 0) || 0

                  return (
                    <TableRow key={framework.id}>
                      <TableCell>
                        <Link
                          href={`/app/frameworks/${framework.id}`}
                          className="font-medium hover:underline underline-offset-4"
                        >
                          {framework.name}
                        </Link>
                        {framework.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">{framework.description}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={framework.source === "template" ? "secondary" : "outline"} className="text-xs">
                          {framework.source === "template"
                            ? "Template"
                            : framework.source === "upload"
                              ? "Import"
                              : "Custom"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {phaseCount} phases, {questionCount} questions
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{framework.usageCount} calls</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(framework.updatedAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/frameworks/${framework.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            {framework.activeVersionId && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/app/frameworks/${framework.id}/versions/${framework.activeVersionId}/edit`}
                                >
                                  Edit Framework
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Templates Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Framework Templates</h2>
          <p className="text-sm text-muted-foreground">Start with a proven sales methodology</p>
        </div>
        <FrameworkTemplates templates={templates} />
      </div>
    </div>
  )
}
