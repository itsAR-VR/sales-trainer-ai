"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Eye, EyeOff, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { EmptyState } from "@/components/empty-state"
import { CopyButton } from "@/components/copy-button"
import { formatDate } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"

interface ApiKey {
  id: string
  name: string
  prefix: string
  scopes: string[]
  createdAt: string
  lastUsedAt: string | null
}

const availableScopes = [
  { id: "calls:read", label: "Read Calls", description: "View call data and recordings" },
  { id: "calls:write", label: "Write Calls", description: "Create and update calls" },
  { id: "frameworks:read", label: "Read Frameworks", description: "View framework configurations" },
  { id: "frameworks:write", label: "Write Frameworks", description: "Create and update frameworks" },
  { id: "clients:read", label: "Read Clients", description: "View client information" },
  { id: "clients:write", label: "Write Clients", description: "Create and update clients" },
]

export function ApiKeysTab() {
  const { toast } = useToast()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch("/api/integrations/api-keys")
      .then((r) => r.json())
      .then((json) => setApiKeys(json.data as ApiKey[]))
      .catch((e) =>
        toast({ title: "Failed to load API keys", description: e instanceof Error ? e.message : "Unknown error", variant: "destructive" }),
      )
  }, [toast])

  const handleCreateKey = async () => {
    const res = await fetch("/api/integrations/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newKeyName, scopes: selectedScopes }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      toast({ title: "Failed to create key", description: json?.error?.message ?? "Unknown error", variant: "destructive" })
      return
    }

    const { key, fullKey } = json.data as { key: ApiKey; fullKey: string }
    setApiKeys((prev) => [key, ...prev])
    setNewlyCreatedKey(fullKey)
    setNewKeyName("")
    setSelectedScopes([])
  }

  const handleDeleteKey = async (id: string) => {
    await fetch(`/api/integrations/api-keys/${id}`, { method: "DELETE" })
    setApiKeys((prev) => prev.filter((key) => key.id !== id))
  }

  const toggleKeyVisibility = (id: string) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisibleKeys(newVisible)
  }

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>Manage API keys for programmatic access to your data</CardDescription>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              {newlyCreatedKey ? (
                <>
                  <DialogHeader>
                    <DialogTitle>API Key Created</DialogTitle>
                    <DialogDescription>Copy your API key now. You won't be able to see it again.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm">
                      <span className="flex-1 break-all">{newlyCreatedKey}</span>
                      <CopyButton value={newlyCreatedKey} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      onClick={() => {
                        setNewlyCreatedKey(null)
                        setIsCreateOpen(false)
                      }}
                    >
                      Done
                    </Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <DialogHeader>
                    <DialogTitle>Create API Key</DialogTitle>
                    <DialogDescription>Create a new API key with specific permissions</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Key Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., Production API"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Scopes</Label>
                      <div className="space-y-2">
                        {availableScopes.map((scope) => (
                          <div key={scope.id} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-muted">
                            <Checkbox
                              id={scope.id}
                              checked={selectedScopes.includes(scope.id)}
                              onCheckedChange={() => toggleScope(scope.id)}
                            />
                            <div className="grid gap-1.5 leading-none">
                              <label htmlFor={scope.id} className="text-sm font-medium cursor-pointer">
                                {scope.label}
                              </label>
                              <p className="text-xs text-muted-foreground">{scope.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateKey} disabled={!newKeyName || selectedScopes.length === 0}>
                      Create Key
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {apiKeys.length === 0 ? (
          <EmptyState
            icon={Key}
            title="No API keys"
            description="Create an API key to get started with programmatic access"
            action={
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Key
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Scopes</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Used</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className="font-medium">{key.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {visibleKeys.has(key.id) ? key.prefix : `${key.prefix.substring(0, 10)}...`}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => toggleKeyVisibility(key.id)}
                      >
                        {visibleKeys.has(key.id) ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {key.scopes.slice(0, 2).map((scope) => (
                        <Badge key={scope} variant="secondary" className="text-xs">
                          {scope}
                        </Badge>
                      ))}
                      {key.scopes.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{key.scopes.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(key.createdAt)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {key.lastUsedAt ? formatDate(key.lastUsedAt) : "Never"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteKey(key.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
