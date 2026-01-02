import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { ApiKeysTab } from "@/features/integrations/api-keys-tab"
import { WebhooksTab } from "@/features/integrations/webhooks-tab"
import { EmbedsTab } from "@/features/integrations/embeds-tab"

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Integrations" description="Manage API keys, webhooks, and embed configurations" />

      <Tabs defaultValue="api-keys" className="space-y-6">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="embeds">Embeds</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys">
          <ApiKeysTab />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhooksTab />
        </TabsContent>

        <TabsContent value="embeds">
          <EmbedsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
