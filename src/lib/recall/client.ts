import "server-only"

import { serverEnv } from "@/src/lib/env"

const RECALL_API_BASE_URL = "https://api.recall.ai/api/v1"

async function recallFetch(path: string, init?: RequestInit) {
  const res = await fetch(`${RECALL_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${serverEnv.RECALL_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Recall API ${res.status} ${res.statusText}: ${text}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export async function createBot(opts: { meetingUrl: string; joinAt?: string; retentionHours: number }) {
  return recallFetch("/bots", {
    method: "POST",
    body: JSON.stringify({
      meeting_url: opts.meetingUrl,
      join_at: opts.joinAt,
      recording_config: { retention_hours: opts.retentionHours },
    }),
  })
}

export async function getRecording(recordingId: string) {
  return recallFetch(`/recordings/${encodeURIComponent(recordingId)}`, { method: "GET" })
}

export async function deleteRecording(recordingId: string) {
  try {
    await recallFetch(`/recordings/${encodeURIComponent(recordingId)}`, { method: "DELETE" })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    // Treat not-found as idempotent success.
    if (msg.includes("404")) return
    throw e
  }
}

