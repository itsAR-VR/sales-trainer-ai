"use client"

import type {
  Call,
  CallFilters,
  CallStatus,
  Client,
  CrmExportPayload,
  Framework,
  FrameworkTemplate,
  FrameworkVersion,
  OrgCapabilities,
  Organization,
  TranscriptSegment,
} from "./types"

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    const message = typeof json?.error?.message === "string" ? json.error.message : `Request failed: ${res.status}`
    throw new Error(message)
  }
  return (json?.data ?? json) as T
}

// ==================== CALLS API ====================

export async function listCalls(filters?: CallFilters): Promise<Call[]> {
  const params = new URLSearchParams()
  if (filters?.status?.length) params.set("status", filters.status[0])
  const qs = params.toString()
  return apiFetch<Call[]>(`/api/calls${qs ? `?${qs}` : ""}`)
}

export async function getCall(callId: string): Promise<Call | null> {
  return apiFetch<Call>(`/api/calls/${encodeURIComponent(callId)}`).catch(() => null)
}

export async function getCallPlaybackUrl(callId: string): Promise<string> {
  const data = await apiFetch<{ url: string }>(`/api/calls/${encodeURIComponent(callId)}/playback?type=video_mixed`)
  return data.url
}

export async function getCallTranscript(callId: string): Promise<TranscriptSegment[]> {
  return apiFetch<TranscriptSegment[]>(`/api/calls/${encodeURIComponent(callId)}/transcript`)
}

export async function getCrmExportPayload(callId: string): Promise<CrmExportPayload | null> {
  return apiFetch<CrmExportPayload | null>(`/api/calls/${encodeURIComponent(callId)}/crm-export`)
}

export async function createCall(data: {
  title: string
  meetingUrl: string
  platform: string
  clientId?: string
  createRecallBot?: boolean
}): Promise<Call | null> {
  return apiFetch<Call | null>(`/api/calls`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateParticipantRole(
  callId: string,
  participantId: string,
  role: "rep" | "prospect" | "other",
): Promise<void> {
  await apiFetch(`/api/calls/${encodeURIComponent(callId)}/participants/${encodeURIComponent(participantId)}/role`, {
    method: "POST",
    body: JSON.stringify({ role }),
  })
}

export async function rerunCallFinalize(callId: string): Promise<void> {
  await apiFetch(`/api/calls/${encodeURIComponent(callId)}/rerun-finalize`, { method: "POST" })
}

// ==================== CLIENTS API ====================

export async function listClients(): Promise<Client[]> {
  return apiFetch<Client[]>(`/api/clients`)
}

export async function getClient(clientId: string): Promise<Client | null> {
  return apiFetch<Client>(`/api/clients/${encodeURIComponent(clientId)}`).catch(() => null)
}

export async function getClientCalls(clientId: string): Promise<Call[]> {
  return apiFetch<Call[]>(`/api/clients/${encodeURIComponent(clientId)}/calls`)
}

// ==================== FRAMEWORKS API ====================

export async function listFrameworks(): Promise<Framework[]> {
  return apiFetch<Framework[]>(`/api/frameworks`)
}

export async function getFramework(frameworkId: string): Promise<Framework | null> {
  return apiFetch<Framework>(`/api/frameworks/${encodeURIComponent(frameworkId)}`).catch(() => null)
}

export async function getFrameworkVersion(frameworkId: string, versionId: string): Promise<FrameworkVersion | null> {
  const fw = await getFramework(frameworkId)
  return fw?.versions.find((v) => v.id === versionId) ?? null
}

export async function listFrameworkTemplates(): Promise<FrameworkTemplate[]> {
  return apiFetch<FrameworkTemplate[]>(`/api/frameworks/templates`)
}

export async function createFramework(data: { name: string; description: string; templateId?: string }): Promise<Framework> {
  return apiFetch<Framework>(`/api/frameworks`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function saveFrameworkVersionDraft(
  frameworkId: string,
  version: Partial<FrameworkVersion>,
): Promise<string> {
  const res = await apiFetch<{ versionId: string }>(`/api/frameworks/${encodeURIComponent(frameworkId)}/versions`, {
    method: "POST",
    body: JSON.stringify({ phases: version.phases ?? [], makeActive: true }),
  })
  return res.versionId
}

export async function publishFrameworkVersion(_frameworkId: string, _versionId: string): Promise<void> {
  // Versioning is handled server-side on save; publishing/activation UI can be added later.
}

export async function activateFrameworkVersion(_frameworkId: string, _versionId: string): Promise<void> {
  // Version activation is handled by save endpoint currently.
}

// ==================== DOCUMENT EXTRACTION API ====================

export async function uploadFrameworkDocument(file: File): Promise<{ extractionId: string }> {
  const mimeType = file.type || "application/octet-stream"
  const presign = await apiFetch<{ uploadId: string; bucket: string; key: string; filename: string; mimeType: string; url: string }>(
    "/api/frameworks/import/presign",
    {
      method: "POST",
      body: JSON.stringify({ filename: file.name, mimeType, sizeBytes: file.size }),
    },
  )

  const put = await fetch(presign.url, {
    method: "PUT",
    headers: { "Content-Type": presign.mimeType || mimeType },
    body: file,
  })
  if (!put.ok) {
    const text = await put.text().catch(() => "")
    throw new Error(`Upload failed: ${put.status} ${text.slice(0, 120)}`)
  }

  return apiFetch<{ extractionId: string; ocrRequired?: boolean }>("/api/frameworks/import/finalize", {
    method: "POST",
    body: JSON.stringify({
      uploadId: presign.uploadId,
      bucket: presign.bucket,
      key: presign.key,
      filename: presign.filename,
      mimeType: presign.mimeType || mimeType,
    }),
  })
}

export async function getExtractedText(extractionId: string): Promise<string> {
  const res = await apiFetch<{ text: string }>(`/api/frameworks/import/${encodeURIComponent(extractionId)}/text`)
  return res.text
}

export async function generateFrameworkDraft(
  extractionId: string,
): Promise<{ version: FrameworkVersion; promptViewText: string }> {
  const res = await apiFetch<{ schema: any; promptViewText: string }>(`/api/frameworks/import/${encodeURIComponent(extractionId)}/draft`, {
    method: "POST",
  })
  const schema = res.schema as any
  const phases = (schema?.phases ?? []).map((p: any, idx: number) => ({
    id: `draft-ph-${idx + 1}`,
    name: String(p.name ?? `Phase ${idx + 1}`),
    objective: String(p.objective ?? ""),
    rubric: String(p.rubric ?? ""),
    order: idx + 1,
    battleCards: (p.battleCards ?? []).map((b: any, j: number) => ({
      id: `bc-${idx + 1}-${j + 1}`,
      title: String(b.title ?? "Battlecard"),
      trigger: String((b.triggerTags ?? []).join(", ")),
      response: String(b.content ?? ""),
      tags: (b.triggerTags ?? []).map(String),
    })),
    questions: (p.questions ?? []).map((q: any, j: number) => ({
      id: `q-${idx + 1}-${j + 1}`,
      text: String(q.text ?? ""),
      weight: Number(q.weight ?? 1),
      tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
      required: !!q.required,
      order: j + 1,
    })),
  }))

  const version: FrameworkVersion = {
    id: `draft-${Date.now()}`,
    frameworkId: "",
    versionNumber: 1,
    phases,
    isActive: false,
    isDraft: true,
    createdAt: new Date().toISOString(),
    createdBy: "AI Extraction",
    publishedAt: undefined,
  }
  return { version, promptViewText: res.promptViewText }
}

// ==================== ORGANIZATION API ====================

export async function getOrganization(): Promise<Organization> {
  const data = await apiFetch<{ id: string; name: string; slug: string; description?: string | null; retentionDays: number; createdAt: string }>(
    "/api/org",
  )
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    retentionDays: data.retentionDays,
    members: [],
    createdAt: data.createdAt,
  }
}

export async function getOrgCapabilities(): Promise<OrgCapabilities> {
  const me = await apiFetch<{ capabilities: OrgCapabilities }>("/api/me")
  return me.capabilities
}

export async function updateOrganization(data: Partial<Organization>): Promise<Organization> {
  const updated = await apiFetch<any>("/api/org", { method: "PATCH", body: JSON.stringify(data) })
  return {
    id: updated.id,
    name: updated.name,
    slug: updated.slug,
    retentionDays: updated.retentionDays,
    members: [],
    createdAt: updated.createdAt,
  }
}

export const api = {
  calls: {
    list: listCalls,
    getById: getCall,
    create: createCall,
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
}
