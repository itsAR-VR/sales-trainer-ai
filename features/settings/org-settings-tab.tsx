"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

export function OrgSettingsTab() {
  const { toast } = useToast()
  const [orgName, setOrgName] = useState("Acme Corp")
  const [orgSlug, setOrgSlug] = useState("acme-corp")
  const [orgDescription, setOrgDescription] = useState("Leading provider of innovative solutions")
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    toast({
      title: "Settings saved",
      description: "Your organization settings have been updated.",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Basic information about your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Organization Name</Label>
              <Input id="org-name" value={orgName} onChange={(e) => setOrgName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input id="org-slug" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} />
              <p className="text-xs text-muted-foreground">Used in URLs: app.maxout.ai/{orgSlug}</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="org-description">Description</Label>
            <Textarea
              id="org-description"
              value={orgDescription}
              onChange={(e) => setOrgDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for your organization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-destructive/20 bg-destructive/5">
            <div>
              <h4 className="font-medium">Delete Organization</h4>
              <p className="text-sm text-muted-foreground">
                Permanently delete your organization and all associated data
              </p>
            </div>
            <Button variant="destructive">Delete Organization</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
