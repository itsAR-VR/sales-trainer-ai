"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, MoreHorizontal, ExternalLink, Phone, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/empty-state"
import { Users } from "lucide-react"
import type { Client } from "@/lib/types"
import { listClients } from "@/lib/api"

export function ClientsContent() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    listClients()
      .then(setClients)
      .finally(() => setIsLoading(false))
  }, [])

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.company?.toLowerCase().includes(search.toLowerCase()),
  )

  if (!isLoading && clients.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No clients yet"
        description="Clients will appear here as you record calls with them."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Total Calls</TableHead>
              <TableHead>Last Call</TableHead>
              <TableHead>External IDs</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClients.map((client) => (
              <TableRow
                key={client.id}
                className="cursor-pointer"
                onClick={() => router.push(`/app/clients/${client.id}`)}
              >
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.company || "-"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {client.email && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <Mail className="h-3 w-3" />
                      </Button>
                    )}
                    {client.phone && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell>{client.totalCalls}</TableCell>
                <TableCell>{client.lastCallAt ? new Date(client.lastCallAt).toLocaleDateString() : "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {client.externalRefs.slice(0, 2).map((ref) => (
                      <Badge key={ref} variant="outline" className="text-xs">
                        {ref}
                      </Badge>
                    ))}
                    {client.externalRefs.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{client.externalRefs.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/app/clients/${client.id}`)
                        }}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {filteredClients.map((client) => (
          <div
            key={client.id}
            onClick={() => router.push(`/app/clients/${client.id}`)}
            className="rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium">{client.name}</h3>
                {client.company && <p className="text-sm text-muted-foreground">{client.company}</p>}
              </div>
              <Badge variant="secondary">{client.totalCalls} calls</Badge>
            </div>
            {client.lastCallAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last call: {new Date(client.lastCallAt).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
