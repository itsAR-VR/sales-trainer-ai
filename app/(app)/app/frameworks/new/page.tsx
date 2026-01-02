"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PageHeader } from "@/components/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { createFramework } from "@/lib/api"

export default function NewFrameworkPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const framework = await createFramework({ name, description })
      router.push(`/app/frameworks/${framework.id}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Framework"
        description="Create a new custom sales framework"
        breadcrumbs={[{ label: "Frameworks", href: "/app/frameworks" }, { label: "New Framework" }]}
      />

      <Card className="max-w-2xl">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Framework Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Discovery Framework"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the purpose and methodology of this framework..."
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !name}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Framework
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
