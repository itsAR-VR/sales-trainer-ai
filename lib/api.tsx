import type {
  Call,
  CallFilters,
  Client,
  Framework,
  FrameworkTemplate,
  FrameworkVersion,
  IntegrationApiKey,
  WebhookSubscription,
  WebhookEvent,
  WebhookEventFilters,
  JobAttempt,
  JobFilters,
  Organization,
  OrgCapabilities,
  StorageUsage,
  TranscriptSegment,
  CrmExportPayload,
  EmbedSnippet,
} from "./types"
import {
  mockCalls,
  mockClients,
  mockFrameworks,
  mockFrameworkTemplates,
  mockApiKeys,
  mockWebhookSubscriptions,
  mockWebhookEvents,
  mockJobAttempts,
  mockStorageUsage,
  mockOrganization,
  mockOrgCapabilities,
  mockTranscript,
} from "./mock-data"

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ==================== CALLS API ====================

export async function listCalls(filters?: CallFilters): Promise<Call[]> {
  await delay(300)
  let calls = [...mockCalls]

  if (filters?.status?.length) {
    calls = calls.filter((c) => filters.status!.includes(c.status))
  }
  if (filters?.clientId) {
    calls = calls.filter((c) => c.clientId === filters.clientId)
  }
  if (filters?.readyOnly) {
    calls = calls.filter((c) => c.status === "ready")
  }
  if (filters?.search) {
    const search = filters.search.toLowerCase()
    calls = calls.filter(
      (c) =>
        c.title.toLowerCase().includes(search) ||
        c.clientName.toLowerCase().includes(search) ||
        c.participants.some((p) => p.name.toLowerCase().includes(search)),
    )
  }

  return calls.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
}

export async function getCall(callId: string): Promise<Call | null> {
  await delay(200)
  return mockCalls.find((c) => c.id === callId) || null
}

export async function getCallPlaybackUrl(callId: string): Promise<string> {
  await delay(100)
  return "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
}

export async function getCallTranscript(callId: string): Promise<TranscriptSegment[]> {
  await delay(200)
  return mockTranscript
}

export async function getCrmExportPayload(callId: string): Promise<CrmExportPayload | null> {
  await delay(200)
  const call = mockCalls.find((c) => c.id === callId)
  if (!call || !call.summary) return null

  return {
    callId: call.id,
    title: call.title,
    client: {
      id: call.clientId,
      name: call.clientName,
    },
    summary: call.summary.overview,
    keyPoints: call.summary.keyPoints,
    actionItems: call.actionItems.map((ai) => ({
      text: ai.text,
      assignee: ai.assignee,
      dueDate: ai.dueDate,
    })),
    participants: call.participants.map((p) => ({
      name: p.name,
      role: p.role,
    })),
    frameworkScore: call.frameworkScore
      ? {
          name: call.frameworkScore.frameworkName,
          score: call.frameworkScore.overallScore,
        }
      : undefined,
    recordedAt: call.startedAt || call.scheduledAt,
    duration: call.duration || 0,
  }
}

export async function updateParticipantRole(
  callId: string,
  participantId: string,
  role: "rep" | "prospect" | "other",
): Promise<void> {
  await delay(200)
}

export async function rerunCallFinalize(callId: string): Promise<void> {
  await delay(500)
}

// ==================== CLIENTS API ====================

export async function listClients(): Promise<Client[]> {
  await delay(300)
  return mockClients.sort((a, b) => (b.lastCallAt || "").localeCompare(a.lastCallAt || ""))
}

export async function getClient(clientId: string): Promise<Client | null> {
  await delay(200)
  return mockClients.find((c) => c.id === clientId) || null
}

export async function getClientCalls(clientId: string): Promise<Call[]> {
  await delay(300)
  return mockCalls.filter((c) => c.clientId === clientId)
}

// ==================== FRAMEWORKS API ====================

export async function listFrameworks(): Promise<Framework[]> {
  await delay(300)
  return mockFrameworks
}

export async function getFramework(frameworkId: string): Promise<Framework | null> {
  await delay(200)
  return mockFrameworks.find((f) => f.id === frameworkId) || null
}

export async function getFrameworkVersion(frameworkId: string, versionId: string): Promise<FrameworkVersion | null> {
  await delay(200)
  const framework = mockFrameworks.find((f) => f.id === frameworkId)
  return framework?.versions.find((v) => v.id === versionId) || null
}

export async function listFrameworkTemplates(): Promise<FrameworkTemplate[]> {
  await delay(200)
  return mockFrameworkTemplates
}

export async function createFramework(data: {
  name: string
  description: string
  templateId?: string
}): Promise<Framework> {
  await delay(500)
  const newFramework: Framework = {
    id: `fw-${Date.now()}`,
    name: data.name,
    description: data.description,
    source: data.templateId ? "template" : "custom",
    versions: [],
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  return newFramework
}

export async function saveFrameworkVersionDraft(
  frameworkId: string,
  version: Partial<FrameworkVersion>,
): Promise<FrameworkVersion> {
  await delay(500)
  const newVersion: FrameworkVersion = {
    id: `fwv-${Date.now()}`,
    frameworkId,
    versionNumber: 1,
    phases: version.phases || [],
    isActive: false,
    isDraft: true,
    createdAt: new Date().toISOString(),
    createdBy: "Current User",
  }
  return newVersion
}

export async function publishFrameworkVersion(frameworkId: string, versionId: string): Promise<void> {
  await delay(500)
}

export async function activateFrameworkVersion(frameworkId: string, versionId: string): Promise<void> {
  await delay(300)
}

// ==================== DOCUMENT EXTRACTION API ====================

export async function uploadFrameworkDocument(file: File): Promise<{ extractionId: string }> {
  await delay(1000)
  return { extractionId: `ext-${Date.now()}` }
}

export async function getExtractedText(extractionId: string): Promise<string> {
  await delay(500)
  return `# Sample Extracted Sales Framework

## Phase 1: Opening
- Build rapport
- Set agenda
- Confirm time available

## Phase 2: Discovery
- What challenges are you facing?
- What solutions have you tried?
- What would success look like?

## Phase 3: Presentation
- Present relevant features
- Address specific pain points
- Show ROI calculations

## Phase 4: Objection Handling
- Address pricing concerns
- Handle competitive comparisons
- Overcome implementation fears

## Phase 5: Close
- Summarize value
- Propose next steps
- Ask for commitment`
}

export async function generateFrameworkDraft(extractionId: string): Promise<FrameworkVersion> {
  await delay(2000)
  return {
    id: `fwv-draft-${Date.now()}`,
    frameworkId: "",
    versionNumber: 1,
    phases: [
      {
        id: "draft-ph-1",
        name: "Opening",
        objective: "Build rapport and set meeting agenda",
        rubric: "Rep should establish trust and clarify goals within first 2 minutes",
        order: 1,
        questions: [
          {
            id: "dq-1",
            text: "What prompted you to take this meeting?",
            weight: 2,
            tags: ["opening"],
            required: true,
            order: 1,
          },
          {
            id: "dq-2",
            text: "How much time do we have today?",
            weight: 1,
            tags: ["logistics"],
            required: false,
            order: 2,
          },
        ],
        battleCards: [],
      },
      {
        id: "draft-ph-2",
        name: "Discovery",
        objective: "Understand prospect's challenges and goals",
        rubric: "Rep should uncover at least 2 pain points and their business impact",
        order: 2,
        questions: [
          { id: "dq-3", text: "What challenges are you facing?", weight: 3, tags: ["pain"], required: true, order: 1 },
          {
            id: "dq-4",
            text: "What solutions have you tried?",
            weight: 2,
            tags: ["competition"],
            required: true,
            order: 2,
          },
          { id: "dq-5", text: "What would success look like?", weight: 3, tags: ["goals"], required: true, order: 3 },
        ],
        battleCards: [],
      },
    ],
    isActive: false,
    isDraft: true,
    createdAt: new Date().toISOString(),
    createdBy: "AI Extraction",
  }
}

// ==================== INTEGRATIONS API ====================

export async function listApiKeys(): Promise<IntegrationApiKey[]> {
  await delay(200)
  return mockApiKeys
}

export async function createApiKey(data: {
  name: string
  scopes: string[]
}): Promise<{ key: IntegrationApiKey; fullKey: string }> {
  await delay(500)
  const fullKey = `maxout_${Math.random().toString(36).substring(2, 15)}_${Math.random().toString(36).substring(2, 15)}`
  const newKey: IntegrationApiKey = {
    id: `key-${Date.now()}`,
    name: data.name,
    keyPreview: `...${fullKey.slice(-4)}`,
    scopes: data.scopes,
    createdAt: new Date().toISOString(),
  }
  return { key: newKey, fullKey }
}

export async function deleteApiKey(keyId: string): Promise<void> {
  await delay(300)
}

export async function listWebhookSubscriptions(): Promise<WebhookSubscription[]> {
  await delay(200)
  return mockWebhookSubscriptions
}

export async function createWebhookSubscription(data: {
  url: string
  events: string[]
}): Promise<WebhookSubscription> {
  await delay(500)
  const newWebhook: WebhookSubscription = {
    id: `wh-${Date.now()}`,
    url: data.url,
    events: data.events,
    secret: `whsec_${Math.random().toString(36).substring(2, 20)}`,
    isActive: true,
    createdAt: new Date().toISOString(),
  }
  return newWebhook
}

export async function testWebhook(webhookId: string): Promise<{ success: boolean; error?: string }> {
  await delay(1000)
  return { success: Math.random() > 0.3 }
}

export async function deleteWebhookSubscription(webhookId: string): Promise<void> {
  await delay(300)
}

export async function generateEmbedSnippet(type: "call" | "client", entityId: string): Promise<EmbedSnippet> {
  await delay(200)
  const token = Math.random().toString(36).substring(2, 20)
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://app.maxout.ai"
  const embedUrl = `${baseUrl}/embed/${type}s/${entityId}?token=${token}`

  return {
    type,
    entityId,
    token,
    snippet: `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`,
  }
}

// ==================== ADMIN API ====================

export async function listWebhookEvents(filters?: WebhookEventFilters): Promise<WebhookEvent[]> {
  await delay(300)
  let events = [...mockWebhookEvents]

  if (filters?.status) {
    events = events.filter((e) => e.status === filters.status)
  }
  if (filters?.eventType) {
    events = events.filter((e) => e.eventType === filters.eventType)
  }

  return events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function listJobAttempts(filters?: JobFilters): Promise<JobAttempt[]> {
  await delay(300)
  let jobs = [...mockJobAttempts]

  if (filters?.status) {
    jobs = jobs.filter((j) => j.status === filters.status)
  }
  if (filters?.jobType) {
    jobs = jobs.filter((j) => j.jobType === filters.jobType)
  }

  return jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function retryJob(jobId: string): Promise<void> {
  await delay(500)
}

export async function getStorageUsage(): Promise<StorageUsage> {
  await delay(200)
  return mockStorageUsage
}

// ==================== ORGANIZATION API ====================

export async function getOrganization(): Promise<Organization> {
  await delay(200)
  return mockOrganization
}

export async function updateOrganization(data: Partial<Organization>): Promise<Organization> {
  await delay(500)
  return { ...mockOrganization, ...data }
}

export async function getOrgCapabilities(): Promise<OrgCapabilities> {
  await delay(100)
  return mockOrgCapabilities
}

export async function inviteMember(email: string, role: "admin" | "member"): Promise<void> {
  await delay(500)
}

export async function removeMember(memberId: string): Promise<void> {
  await delay(300)
}

export async function updateMemberRole(memberId: string, role: "admin" | "member"): Promise<void> {
  await delay(300)
}

// ==================== API OBJECT ====================

export const api = {
  calls: {
    list: listCalls,
    getById: getCall,
    getPlaybackUrl: getCallPlaybackUrl,
    getTranscript: getCallTranscript,
    getCrmExport: getCrmExportPayload,
    updateParticipantRole,
    rerunFinalize: rerunCallFinalize,
  },
  clients: {
    list: listClients,
    getById: getClient,
    getCalls: getClientCalls,
  },
  frameworks: {
    list: listFrameworks,
    getById: getFramework,
    getVersion: getFrameworkVersion,
    listTemplates: listFrameworkTemplates,
    create: createFramework,
    saveDraft: saveFrameworkVersionDraft,
    publish: publishFrameworkVersion,
    activate: activateFrameworkVersion,
  },
  integrations: {
    listApiKeys,
    createApiKey,
    deleteApiKey,
    listWebhooks: listWebhookSubscriptions,
    createWebhook: createWebhookSubscription,
    testWebhook,
    deleteWebhook: deleteWebhookSubscription,
    generateEmbed: generateEmbedSnippet,
  },
  admin: {
    listWebhookEvents,
    listJobs: listJobAttempts,
    retryJob,
    getStorageUsage,
  },
  organization: {
    get: getOrganization,
    update: updateOrganization,
    getCapabilities: getOrgCapabilities,
    inviteMember,
    removeMember,
    updateMemberRole,
  },
}
