import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { WebhookEventsTab } from "@/features/admin/webhook-events-tab"
import { JobsTab } from "@/features/admin/jobs-tab"
import { StorageTab } from "@/features/admin/storage-tab"

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Admin" description="System administration and monitoring" />

      <Tabs defaultValue="webhook-events" className="space-y-6">
        <TabsList>
          <TabsTrigger value="webhook-events">Webhook Events</TabsTrigger>
          <TabsTrigger value="jobs">Jobs Queue</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
        </TabsList>

        <TabsContent value="webhook-events">
          <WebhookEventsTab />
        </TabsContent>

        <TabsContent value="jobs">
          <JobsTab />
        </TabsContent>

        <TabsContent value="storage">
          <StorageTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
