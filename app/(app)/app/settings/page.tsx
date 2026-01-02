import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { OrgSettingsTab } from "@/features/settings/org-settings-tab"
import { MembersTab } from "@/features/settings/members-tab"
import { RetentionTab } from "@/features/settings/retention-tab"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your organization settings and preferences" />

      <Tabs defaultValue="organization" className="space-y-6">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="retention">Retention</TabsTrigger>
        </TabsList>

        <TabsContent value="organization">
          <OrgSettingsTab />
        </TabsContent>

        <TabsContent value="members">
          <MembersTab />
        </TabsContent>

        <TabsContent value="retention">
          <RetentionTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
