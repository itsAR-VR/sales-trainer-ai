// ==================== ENUMS ====================

export type CallStatus = "scheduled" | "in_progress" | "processing" | "ready" | "failed"

export type Platform = "zoom" | "google_meet" | "teams" | "webex" | "other"

export type ArtifactStatus = "pending" | "downloading" | "uploaded" | "verified" | "deleted_from_recall" | "failed"

export type SpeakerRole = "rep" | "prospect" | "other"

export type FrameworkSource = "template" | "upload" | "custom"

export type JobStatus = "pending" | "running" | "completed" | "failed" | "retrying"

export type WebhookEventStatus = "pending" | "delivered" | "failed"

// ==================== CORE ENTITIES ====================

export interface MediaAsset {
  id: string
  type: "video_mixed" | "audio_mixed" | "transcript" | "participant_events" | "meeting_metadata"
  bucket: string
  path: string
  size: number
  mimeType: string
  status: ArtifactStatus
  verifiedAt: string | null
  recallDeletedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Participant {
  id: string
  name: string
  email?: string
  role: SpeakerRole
  speakerLabel: string
}

export interface TranscriptSegment {
  id: string
  speakerLabel: string
  speakerRole: SpeakerRole
  speakerName: string
  startMs: number
  endMs: number
  text: string
  isHighlight?: boolean
  highlightType?: "objection" | "question" | "commitment" | "pain_point"
}

export interface ActionItem {
  id: string
  text: string
  completed: boolean
  assignee?: string
  dueDate?: string
}

export interface Summary {
  id: string
  overview: string
  keyPoints: string[]
  nextSteps: string[]
  sentiment: "positive" | "neutral" | "negative"
}

export interface FrameworkScore {
  frameworkId: string
  frameworkName: string
  versionId: string
  overallScore: number
  phaseScores: {
    phaseId: string
    phaseName: string
    score: number
    coveredQuestions: number
    totalQuestions: number
  }[]
  missedQuestions: {
    phaseId: string
    phaseName: string
    questionId: string
    questionText: string
  }[]
  coachingPlan: {
    nextCallAgenda: string[]
    questionsToAsk: string[]
  }
}

export interface ArchivalStep {
  id: string
  step: "recall_complete" | "download_started" | "download_complete" | "upload_complete" | "verified" | "recall_deleted"
  status: "completed" | "in_progress" | "failed" | "pending"
  timestamp: string | null
  error?: string
}

export interface Call {
  id: string
  title: string
  clientId: string
  clientName: string
  platform: Platform
  scheduledAt: string
  startedAt?: string
  endedAt?: string
  duration?: number // in seconds
  status: CallStatus
  participants: Participant[]
  mediaAssets: MediaAsset[]
  summary?: Summary
  actionItems: ActionItem[]
  frameworkScore?: FrameworkScore
  archivalSteps: ArchivalStep[]
  recallBotId?: string
  externalRef?: string
  createdAt: string
  updatedAt: string
}

// ==================== CLIENT ====================

export interface Client {
  id: string
  name: string
  company?: string
  email?: string
  phone?: string
  externalRefs: string[]
  totalCalls: number
  lastCallAt?: string
  createdAt: string
  updatedAt: string
}

// ==================== FRAMEWORK ====================

export interface BattleCard {
  id: string
  title: string
  trigger: string
  response: string
  tags: string[]
}

export interface Question {
  id: string
  text: string
  weight: number
  tags: string[]
  required: boolean
  order: number
}

export interface Phase {
  id: string
  name: string
  objective: string
  rubric: string
  questions: Question[]
  battleCards: BattleCard[]
  order: number
}

export interface FrameworkVersion {
  id: string
  frameworkId: string
  versionNumber: number
  phases: Phase[]
  isActive: boolean
  isDraft: boolean
  createdAt: string
  createdBy: string
  publishedAt?: string
}

export interface Framework {
  id: string
  name: string
  description: string
  source: FrameworkSource
  activeVersionId?: string
  versions: FrameworkVersion[]
  usageCount: number
  createdAt: string
  updatedAt: string
}

export interface FrameworkTemplate {
  id: string
  name: string
  description: string
  category: string
  previewPhases: string[]
  isLicensed: boolean
  phaseCount: number
  questionCount: number
}

// ==================== INTEGRATIONS ====================

export interface IntegrationApiKey {
  id: string
  name: string
  keyPreview: string // Last 4 characters
  scopes: string[]
  createdAt: string
  lastUsedAt?: string
  expiresAt?: string
}

export interface WebhookSubscription {
  id: string
  url: string
  events: string[]
  secret: string
  isActive: boolean
  lastDeliveryAt?: string
  lastDeliveryStatus?: "success" | "failed"
  createdAt: string
}

export interface EmbedSnippet {
  type: "call" | "client"
  entityId: string
  token: string
  snippet: string
}

// ==================== ADMIN ====================

export interface WebhookEvent {
  id: string
  subscriptionId: string
  eventType: string
  payload: Record<string, unknown>
  status: WebhookEventStatus
  attempts: number
  lastAttemptAt?: string
  deliveredAt?: string
  error?: string
  createdAt: string
}

export interface JobAttempt {
  id: string
  jobType: "finalize_recording" | "run_analysis" | "sync_crm" | "delete_recall"
  entityId: string
  entityType: "call" | "framework"
  status: JobStatus
  attempts: number
  lastError?: string
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface StorageUsage {
  totalBytes: number
  videoBytes: number
  audioBytes: number
  transcriptBytes: number
  otherBytes: number
  callCount: number
}

// ==================== ORGANIZATION ====================

export interface OrgMember {
  id: string
  name: string
  email: string
  role: "owner" | "admin" | "member"
  joinedAt: string
  lastActiveAt?: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  retentionDays: number
  members: OrgMember[]
  createdAt: string
}

export interface OrgCapabilities {
  v1Features: {
    callLibrary: boolean
    frameworks: boolean
    integrations: boolean
    embeds: boolean
  }
  v2Features: {
    liveCoach: boolean
    contentStudio: boolean
    whiteLabel: boolean
  }
  limits: {
    maxCalls: number
    maxFrameworks: number
    maxApiKeys: number
    maxWebhooks: number
  }
}

// ==================== CRM EXPORT ====================

export interface CrmExportPayload {
  callId: string
  title: string
  client: {
    id: string
    name: string
    externalRef?: string
  }
  summary: string
  keyPoints: string[]
  actionItems: {
    text: string
    assignee?: string
    dueDate?: string
  }[]
  participants: {
    name: string
    role: string
  }[]
  frameworkScore?: {
    name: string
    score: number
  }
  recordedAt: string
  duration: number
}

// ==================== FILTERS ====================

export interface CallFilters {
  status?: CallStatus[]
  dateFrom?: string
  dateTo?: string
  clientId?: string
  frameworkId?: string
  readyOnly?: boolean
  search?: string
}

export interface WebhookEventFilters {
  eventType?: string
  status?: WebhookEventStatus
  subscriptionId?: string
  dateFrom?: string
  dateTo?: string
}

export interface JobFilters {
  jobType?: string
  status?: JobStatus
  entityType?: string
}
