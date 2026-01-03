-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "SpeakerRole" AS ENUM ('REP', 'PROSPECT', 'OTHER');

-- CreateEnum
CREATE TYPE "FrameworkSource" AS ENUM ('TEMPLATE', 'UPLOAD', 'CUSTOM');

-- CreateEnum
CREATE TYPE "JobType" AS ENUM ('FINALIZE_RECORDING', 'ANALYZE_CALL', 'RECONCILE_INCOMPLETE_CALLS');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalRef" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "systemName" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clientId" UUID,

    CONSTRAINT "ExternalRef_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Call" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "clientId" UUID,
    "frameworkVersionId" UUID,
    "title" TEXT NOT NULL,
    "meetingUrl" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "status" "CallStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Call_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallBot" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "recallBotId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "joinAt" TIMESTAMP(3),
    "lastEventAt" TIMESTAMP(3),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecallBot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecallRecording" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "recallRecordingId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "recallDeletedAt" TIMESTAMP(3),
    "mediaShortcutsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecallRecording_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" UUID NOT NULL,
    "orgId" UUID,
    "callId" UUID,
    "provider" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "error" TEXT,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "sha256" TEXT,
    "etag" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transcript" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "rawJsonPath" TEXT,
    "rawJsonJson" JSONB,
    "textPreview" TEXT NOT NULL,
    "language" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transcript_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptSegment" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "transcriptId" UUID NOT NULL,
    "speakerLabel" TEXT NOT NULL,
    "speakerRole" "SpeakerRole" NOT NULL DEFAULT 'OTHER',
    "startMs" INTEGER NOT NULL,
    "endMs" INTEGER NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "TranscriptSegment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "speakerLabel" TEXT NOT NULL,
    "speakerRole" "SpeakerRole" NOT NULL DEFAULT 'OTHER',
    "name" TEXT,
    "email" TEXT,
    "role" TEXT,
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Framework" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source" "FrameworkSource" NOT NULL DEFAULT 'CUSTOM',
    "isTemplateCatalog" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Framework_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkVersion" (
    "id" UUID NOT NULL,
    "frameworkId" UUID NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "FrameworkVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkPhase" (
    "id" UUID NOT NULL,
    "frameworkVersionId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "objective" TEXT,
    "rubricJson" JSONB,

    CONSTRAINT "FrameworkPhase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkQuestion" (
    "id" UUID NOT NULL,
    "phaseId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "tags" TEXT[],
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "FrameworkQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BattleCard" (
    "id" UUID NOT NULL,
    "frameworkVersionId" UUID NOT NULL,
    "triggerTags" TEXT[],
    "title" TEXT NOT NULL,
    "contentJson" JSONB NOT NULL,

    CONSTRAINT "BattleCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentUpload" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "bucket" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "extractedTextPath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentUpload_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkDraft" (
    "id" UUID NOT NULL,
    "uploadId" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "generatedSchemaJson" JSONB NOT NULL,
    "promptViewText" TEXT NOT NULL,
    "modelInfoJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameworkDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CallSummary" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "modelInfoJson" JSONB NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CallSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActionItem" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "ownerUserId" UUID,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FrameworkScore" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "frameworkVersionId" UUID NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FrameworkScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CRMNoteExport" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CRMNoteExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hashedKey" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboundWebhookSubscription" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "events" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "disabledAt" TIMESTAMP(3),

    CONSTRAINT "OutboundWebhookSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbedToken" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "scope" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmbedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "type" "JobType" NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastError" TEXT,
    "dedupeKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "callId" UUID,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveCoachSession" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "callId" UUID,
    "status" TEXT NOT NULL,
    "payloadJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiveCoachSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentStudioAsset" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "payloadJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentStudioAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WhiteLabelConfig" (
    "id" UUID NOT NULL,
    "orgId" UUID NOT NULL,
    "brandJson" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WhiteLabelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_supabaseUserId_key" ON "User"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE INDEX "Membership_orgId_idx" ON "Membership"("orgId");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_orgId_userId_key" ON "Membership"("orgId", "userId");

-- CreateIndex
CREATE INDEX "Client_orgId_idx" ON "Client"("orgId");

-- CreateIndex
CREATE INDEX "ExternalRef_orgId_idx" ON "ExternalRef"("orgId");

-- CreateIndex
CREATE INDEX "ExternalRef_clientId_idx" ON "ExternalRef"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalRef_orgId_systemName_entityType_externalId_key" ON "ExternalRef"("orgId", "systemName", "entityType", "externalId");

-- CreateIndex
CREATE INDEX "Call_orgId_idx" ON "Call"("orgId");

-- CreateIndex
CREATE INDEX "Call_clientId_idx" ON "Call"("clientId");

-- CreateIndex
CREATE INDEX "Call_frameworkVersionId_idx" ON "Call"("frameworkVersionId");

-- CreateIndex
CREATE INDEX "Call_status_idx" ON "Call"("status");

-- CreateIndex
CREATE UNIQUE INDEX "RecallBot_recallBotId_key" ON "RecallBot"("recallBotId");

-- CreateIndex
CREATE INDEX "RecallBot_callId_idx" ON "RecallBot"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "RecallRecording_recallRecordingId_key" ON "RecallRecording"("recallRecordingId");

-- CreateIndex
CREATE INDEX "RecallRecording_callId_idx" ON "RecallRecording"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_orgId_idx" ON "WebhookEvent"("orgId");

-- CreateIndex
CREATE INDEX "WebhookEvent_callId_idx" ON "WebhookEvent"("callId");

-- CreateIndex
CREATE INDEX "WebhookEvent_provider_receivedAt_idx" ON "WebhookEvent"("provider", "receivedAt");

-- CreateIndex
CREATE INDEX "MediaAsset_callId_idx" ON "MediaAsset"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_bucket_path_key" ON "MediaAsset"("bucket", "path");

-- CreateIndex
CREATE INDEX "Transcript_callId_idx" ON "Transcript"("callId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_callId_idx" ON "TranscriptSegment"("callId");

-- CreateIndex
CREATE INDEX "TranscriptSegment_transcriptId_idx" ON "TranscriptSegment"("transcriptId");

-- CreateIndex
CREATE INDEX "Participant_callId_idx" ON "Participant"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "Participant_callId_speakerLabel_key" ON "Participant"("callId", "speakerLabel");

-- CreateIndex
CREATE INDEX "Framework_orgId_idx" ON "Framework"("orgId");

-- CreateIndex
CREATE INDEX "FrameworkVersion_frameworkId_idx" ON "FrameworkVersion"("frameworkId");

-- CreateIndex
CREATE INDEX "FrameworkVersion_isActive_idx" ON "FrameworkVersion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkVersion_frameworkId_versionNumber_key" ON "FrameworkVersion"("frameworkId", "versionNumber");

-- CreateIndex
CREATE INDEX "FrameworkPhase_frameworkVersionId_idx" ON "FrameworkPhase"("frameworkVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkPhase_frameworkVersionId_sortOrder_key" ON "FrameworkPhase"("frameworkVersionId", "sortOrder");

-- CreateIndex
CREATE INDEX "FrameworkQuestion_phaseId_idx" ON "FrameworkQuestion"("phaseId");

-- CreateIndex
CREATE INDEX "BattleCard_frameworkVersionId_idx" ON "BattleCard"("frameworkVersionId");

-- CreateIndex
CREATE INDEX "DocumentUpload_orgId_idx" ON "DocumentUpload"("orgId");

-- CreateIndex
CREATE INDEX "DocumentUpload_userId_idx" ON "DocumentUpload"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentUpload_bucket_path_key" ON "DocumentUpload"("bucket", "path");

-- CreateIndex
CREATE UNIQUE INDEX "FrameworkDraft_uploadId_key" ON "FrameworkDraft"("uploadId");

-- CreateIndex
CREATE INDEX "FrameworkDraft_orgId_idx" ON "FrameworkDraft"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "CallSummary_callId_key" ON "CallSummary"("callId");

-- CreateIndex
CREATE INDEX "CallSummary_callId_idx" ON "CallSummary"("callId");

-- CreateIndex
CREATE INDEX "ActionItem_callId_idx" ON "ActionItem"("callId");

-- CreateIndex
CREATE INDEX "ActionItem_ownerUserId_idx" ON "ActionItem"("ownerUserId");

-- CreateIndex
CREATE INDEX "FrameworkScore_callId_idx" ON "FrameworkScore"("callId");

-- CreateIndex
CREATE INDEX "FrameworkScore_frameworkVersionId_idx" ON "FrameworkScore"("frameworkVersionId");

-- CreateIndex
CREATE INDEX "CRMNoteExport_callId_idx" ON "CRMNoteExport"("callId");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_hashedKey_key" ON "ApiKey"("hashedKey");

-- CreateIndex
CREATE INDEX "ApiKey_orgId_idx" ON "ApiKey"("orgId");

-- CreateIndex
CREATE INDEX "OutboundWebhookSubscription_orgId_idx" ON "OutboundWebhookSubscription"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "EmbedToken_tokenHash_key" ON "EmbedToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmbedToken_orgId_idx" ON "EmbedToken"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_dedupeKey_key" ON "Job"("dedupeKey");

-- CreateIndex
CREATE INDEX "Job_orgId_idx" ON "Job"("orgId");

-- CreateIndex
CREATE INDEX "Job_status_runAt_idx" ON "Job"("status", "runAt");

-- CreateIndex
CREATE INDEX "Job_callId_idx" ON "Job"("callId");

-- CreateIndex
CREATE INDEX "LiveCoachSession_orgId_idx" ON "LiveCoachSession"("orgId");

-- CreateIndex
CREATE INDEX "LiveCoachSession_callId_idx" ON "LiveCoachSession"("callId");

-- CreateIndex
CREATE INDEX "ContentStudioAsset_orgId_idx" ON "ContentStudioAsset"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "WhiteLabelConfig_orgId_key" ON "WhiteLabelConfig"("orgId");

-- CreateIndex
CREATE INDEX "WhiteLabelConfig_orgId_idx" ON "WhiteLabelConfig"("orgId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalRef" ADD CONSTRAINT "ExternalRef_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExternalRef" ADD CONSTRAINT "ExternalRef_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Call" ADD CONSTRAINT "Call_frameworkVersionId_fkey" FOREIGN KEY ("frameworkVersionId") REFERENCES "FrameworkVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallBot" ADD CONSTRAINT "RecallBot_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecallRecording" ADD CONSTRAINT "RecallRecording_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WebhookEvent" ADD CONSTRAINT "WebhookEvent_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transcript" ADD CONSTRAINT "Transcript_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptSegment" ADD CONSTRAINT "TranscriptSegment_transcriptId_fkey" FOREIGN KEY ("transcriptId") REFERENCES "Transcript"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Framework" ADD CONSTRAINT "Framework_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkVersion" ADD CONSTRAINT "FrameworkVersion_frameworkId_fkey" FOREIGN KEY ("frameworkId") REFERENCES "Framework"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkVersion" ADD CONSTRAINT "FrameworkVersion_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkPhase" ADD CONSTRAINT "FrameworkPhase_frameworkVersionId_fkey" FOREIGN KEY ("frameworkVersionId") REFERENCES "FrameworkVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkQuestion" ADD CONSTRAINT "FrameworkQuestion_phaseId_fkey" FOREIGN KEY ("phaseId") REFERENCES "FrameworkPhase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BattleCard" ADD CONSTRAINT "BattleCard_frameworkVersionId_fkey" FOREIGN KEY ("frameworkVersionId") REFERENCES "FrameworkVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentUpload" ADD CONSTRAINT "DocumentUpload_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkDraft" ADD CONSTRAINT "FrameworkDraft_uploadId_fkey" FOREIGN KEY ("uploadId") REFERENCES "DocumentUpload"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkDraft" ADD CONSTRAINT "FrameworkDraft_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CallSummary" ADD CONSTRAINT "CallSummary_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActionItem" ADD CONSTRAINT "ActionItem_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkScore" ADD CONSTRAINT "FrameworkScore_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FrameworkScore" ADD CONSTRAINT "FrameworkScore_frameworkVersionId_fkey" FOREIGN KEY ("frameworkVersionId") REFERENCES "FrameworkVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CRMNoteExport" ADD CONSTRAINT "CRMNoteExport_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutboundWebhookSubscription" ADD CONSTRAINT "OutboundWebhookSubscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbedToken" ADD CONSTRAINT "EmbedToken_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveCoachSession" ADD CONSTRAINT "LiveCoachSession_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveCoachSession" ADD CONSTRAINT "LiveCoachSession_callId_fkey" FOREIGN KEY ("callId") REFERENCES "Call"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContentStudioAsset" ADD CONSTRAINT "ContentStudioAsset_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

