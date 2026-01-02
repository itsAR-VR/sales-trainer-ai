import type {
  ActionItem as UiActionItem,
  Call as UiCall,
  Client as UiClient,
  Framework as UiFramework,
  FrameworkTemplate as UiFrameworkTemplate,
  FrameworkVersion as UiFrameworkVersion,
  TranscriptSegment as UiTranscriptSegment,
} from "@/lib/types"
import {
  CallStatus,
  FrameworkSource,
  MembershipRole,
  SpeakerRole,
  type ActionItem,
  type Call,
  type CallSummary,
  type Client,
  type Framework,
  type FrameworkPhase,
  type FrameworkQuestion,
  type FrameworkScore,
  type FrameworkVersion,
  type MediaAsset,
  type Participant,
} from "@prisma/client"

export function toIso(dt: Date | null | undefined) {
  return dt ? dt.toISOString() : undefined
}

export function mapCallStatus(status: CallStatus): UiCall["status"] {
  switch (status) {
    case CallStatus.SCHEDULED:
      return "scheduled"
    case CallStatus.IN_PROGRESS:
      return "in_progress"
    case CallStatus.PROCESSING:
      return "processing"
    case CallStatus.READY:
      return "ready"
    case CallStatus.FAILED:
      return "failed"
  }
}

export function mapSpeakerRole(role: SpeakerRole): UiTranscriptSegment["speakerRole"] {
  switch (role) {
    case SpeakerRole.REP:
      return "rep"
    case SpeakerRole.PROSPECT:
      return "prospect"
    case SpeakerRole.OTHER:
      return "other"
  }
}

export function mapFrameworkSource(source: FrameworkSource): UiFramework["source"] {
  switch (source) {
    case FrameworkSource.TEMPLATE:
      return "template"
    case FrameworkSource.UPLOAD:
      return "upload"
    case FrameworkSource.CUSTOM:
      return "custom"
  }
}

export function mapMembershipRole(role: MembershipRole) {
  switch (role) {
    case MembershipRole.OWNER:
      return "owner" as const
    case MembershipRole.ADMIN:
      return "admin" as const
    case MembershipRole.MEMBER:
      return "member" as const
  }
}

export function toUiClient(client: Client & { externalRefs?: Array<{ externalId: string; systemName: string }> } & { calls?: Call[] }): UiClient {
  return {
    id: client.id,
    name: client.name,
    company: client.company ?? undefined,
    email: client.email ?? undefined,
    phone: client.phone ?? undefined,
    externalRefs: (client.externalRefs ?? []).map((r) => `${r.systemName}:${r.externalId}`),
    totalCalls: client.calls?.length ?? 0,
    lastCallAt: client.calls?.[0]?.scheduledAt?.toISOString(),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  }
}

export function toUiFrameworkVersion(version: FrameworkVersion & { phases: Array<FrameworkPhase & { questions: FrameworkQuestion[] }> }): UiFrameworkVersion {
  return {
    id: version.id,
    frameworkId: version.frameworkId,
    versionNumber: version.versionNumber,
    phases: version.phases
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((p) => ({
        id: p.id,
        name: p.name,
        objective: p.objective ?? "",
        rubric:
          typeof p.rubricJson === "string"
            ? p.rubricJson
            : typeof (p.rubricJson as any)?.text === "string"
              ? (p.rubricJson as any).text
              : "",
        order: p.sortOrder,
        battleCards: [],
        questions: p.questions.map((q, idx) => ({
          id: q.id,
          text: q.text,
          weight: q.weight,
          tags: q.tags,
          required: false,
          order: idx + 1,
        })),
      })),
    isActive: version.isActive,
    isDraft: false,
    createdAt: version.createdAt.toISOString(),
    createdBy: "System",
  }
}

export function toUiFramework(framework: Framework & { versions: Array<FrameworkVersion & { phases: Array<FrameworkPhase & { questions: FrameworkQuestion[] }> }> }): UiFramework {
  const activeVersion = framework.versions.find((v) => v.isActive) ?? null
  return {
    id: framework.id,
    name: framework.name,
    description: framework.description ?? "",
    source: mapFrameworkSource(framework.source),
    activeVersionId: activeVersion?.id,
    versions: framework.versions.map(toUiFrameworkVersion),
    usageCount: 0,
    createdAt: framework.createdAt.toISOString(),
    updatedAt: framework.updatedAt.toISOString(),
  }
}

export function toUiFrameworkTemplate(
  framework: Framework & { versions: Array<FrameworkVersion & { phases: Array<FrameworkPhase & { questions: FrameworkQuestion[] }> }> },
): UiFrameworkTemplate {
  const activeVersion = framework.versions.find((v) => v.isActive) ?? framework.versions[0]
  const phases = activeVersion?.phases ?? []
  const questionCount = phases.reduce((acc, p) => acc + p.questions.length, 0)
  return {
    id: framework.id,
    name: framework.name,
    description: framework.description ?? "Template",
    category: "popular",
    previewPhases: phases.slice(0, 3).map((p) => p.name),
    isLicensed: false,
    phaseCount: phases.length,
    questionCount,
  }
}

function artifactStatusFrom(asset: MediaAsset) {
  if (asset.verifiedAt) return "verified" as const
  return "pending" as const
}

export function toUiCall(call: Call & {
  client: Client | null
  participants: Participant[]
  mediaAssets: MediaAsset[]
  callSummary: CallSummary | null
  actionItems: ActionItem[]
  frameworkScores: FrameworkScore[]
}): UiCall {
  const duration =
    call.startedAt && call.endedAt ? Math.max(0, Math.round((call.endedAt.getTime() - call.startedAt.getTime()) / 1000)) : undefined

  const summaryPayload = (call.callSummary?.payloadJson ?? null) as unknown as any

  const summary =
    summaryPayload && typeof summaryPayload === "object"
      ? {
          id: call.callSummary!.id,
          overview: String(summaryPayload.overview ?? ""),
          keyPoints: Array.isArray(summaryPayload.keyPoints)
            ? summaryPayload.keyPoints.map(String)
            : Array.isArray(summaryPayload.keyMoments)
              ? summaryPayload.keyMoments.map((m: any) => String(m.label ?? m.detail ?? "")).filter(Boolean)
              : [],
          nextSteps: Array.isArray(summaryPayload.nextSteps) ? summaryPayload.nextSteps.map(String) : [],
          sentiment: "neutral" as const,
        }
      : undefined

  const latestFrameworkScore = call.frameworkScores[0]
  const frameworkScorePayload = (latestFrameworkScore?.payloadJson ?? null) as any

  return {
    id: call.id,
    title: call.title,
    clientId: call.clientId ?? "",
    clientName: call.client?.name ?? "Unknown",
    platform: call.platform as any,
    scheduledAt: call.scheduledAt.toISOString(),
    startedAt: toIso(call.startedAt),
    endedAt: toIso(call.endedAt),
    duration,
    status: mapCallStatus(call.status),
    participants: call.participants.map((p) => ({
      id: p.id,
      name: p.name ?? p.speakerLabel,
      email: p.email ?? undefined,
      role: mapSpeakerRole(p.speakerRole),
      speakerLabel: p.speakerLabel,
    })),
    mediaAssets: call.mediaAssets.map((a) => ({
      id: a.id,
      type: a.type as any,
      bucket: a.bucket,
      path: a.path,
      size: Number(a.sizeBytes ?? 0n),
      mimeType: a.contentType,
      status: artifactStatusFrom(a),
      verifiedAt: a.verifiedAt?.toISOString() ?? null,
      recallDeletedAt: null,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.createdAt.toISOString(),
    })),
    summary,
    actionItems: call.actionItems.map<UiActionItem>((ai) => ({
      id: ai.id,
      text: ai.text,
      completed: ai.status === "done",
      assignee: undefined,
      dueDate: ai.dueAt?.toISOString(),
    })),
    frameworkScore:
      frameworkScorePayload && typeof frameworkScorePayload === "object" && typeof frameworkScorePayload.overallScore === "number"
        ? {
            frameworkId: call.frameworkVersionId ?? "",
            frameworkName: "Framework",
            versionId: call.frameworkVersionId ?? "",
            overallScore: frameworkScorePayload.overallScore,
            phaseScores: frameworkScorePayload.phaseScores ?? [],
            missedQuestions: frameworkScorePayload.missedQuestions ?? [],
            coachingPlan: frameworkScorePayload.coachingPlan ?? { nextCallAgenda: [], questionsToAsk: [] },
          }
        : undefined,
    archivalSteps: [],
    recallBotId: undefined,
    externalRef: undefined,
    createdAt: call.createdAt.toISOString(),
  }
}

export function toUiTranscriptSegments(
  segments: Array<{ id: string; speakerLabel: string; speakerRole: SpeakerRole; startMs: number; endMs: number; text: string }>,
): UiTranscriptSegment[] {
  return segments
    .sort((a, b) => a.startMs - b.startMs)
    .map((s) => ({
      id: s.id,
      speakerLabel: s.speakerLabel,
      speakerRole: mapSpeakerRole(s.speakerRole),
      speakerName: s.speakerLabel,
      startMs: s.startMs,
      endMs: s.endMs,
      text: s.text,
    }))
}
