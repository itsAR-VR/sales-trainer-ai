import "server-only"

import { JobType, JobStatus, CallStatus, type Job, type PrismaClient, SpeakerRole } from "@prisma/client"
import { Readable } from "node:stream"
import { createHash } from "node:crypto"
import { getRecording, deleteRecording } from "@/src/lib/recall/client"
import { serverEnv } from "@/src/lib/env"
import { callRecordingObjectKey } from "@/src/lib/storage/paths"
import { uploadStream, headObject, downloadObjectToBuffer } from "@/src/lib/storage/s3"
import { analyzeCallWithOpenAI } from "@/src/lib/jobs/steps/analyze"
import { enqueueJob } from "@/src/lib/jobs/enqueue"

type FinalizeRecordingPayload = {
  orgId: string
  callId: string
  recallRecordingId: string
}

type AnalyzeCallPayload = {
  orgId: string
  callId: string
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null) return null
  return value as Record<string, unknown>
}

function getShortcutUrl(mediaShortcuts: unknown, key: string): string | null {
  const obj = asObject(mediaShortcuts)
  if (!obj) return null
  const entry = obj[key]
  const entryObj = asObject(entry)
  const url = entryObj?.url
  return typeof url === "string" ? url : null
}

async function fetchToNodeStream(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Artifact download failed: ${res.status} ${res.statusText}`)
  if (!res.body) throw new Error("Artifact download returned empty body")
  const contentType = res.headers.get("content-type") ?? "application/octet-stream"
  const stream = Readable.fromWeb(res.body as never)
  return { stream, contentType }
}

async function ensureMediaAssetVerified(
  prisma: PrismaClient,
  opts: {
    callId: string
    bucket: string
    key: string
    type: string
    downloadUrl: string
  },
) {
  const existing = await prisma.mediaAsset.findUnique({
    where: { bucket_path: { bucket: opts.bucket, path: opts.key } },
    select: { id: true, verifiedAt: true },
  })
  if (existing?.verifiedAt) return existing

  const { stream, contentType } = await fetchToNodeStream(opts.downloadUrl)
  const { etag } = await uploadStream({ bucket: opts.bucket, key: opts.key, stream, contentType })
  const head = await headObject({ bucket: opts.bucket, key: opts.key })

  return prisma.mediaAsset.upsert({
    where: { bucket_path: { bucket: opts.bucket, path: opts.key } },
    create: {
      callId: opts.callId,
      type: opts.type,
      bucket: opts.bucket,
      path: opts.key,
      contentType,
      sizeBytes: head.sizeBytes,
      etag: etag ?? head.etag,
      verifiedAt: new Date(),
    },
    update: {
      contentType,
      sizeBytes: head.sizeBytes,
      etag: etag ?? head.etag,
      verifiedAt: new Date(),
    },
  })
}

async function finalizeRecording(prisma: PrismaClient, payload: FinalizeRecordingPayload) {
  await prisma.call.update({ where: { id: payload.callId }, data: { status: CallStatus.PROCESSING } })

  const recording = await getRecording(payload.recallRecordingId)
  const recordingObj = asObject(recording) ?? {}
  const mediaShortcuts =
    recordingObj.media_shortcuts ?? (asObject(recordingObj.data)?.media_shortcuts ?? asObject(recordingObj.recording)?.media_shortcuts)

  await prisma.recallRecording.upsert({
    where: { recallRecordingId: payload.recallRecordingId },
    create: {
      callId: payload.callId,
      recallRecordingId: payload.recallRecordingId,
      status: "ready",
      mediaShortcutsJson: mediaShortcuts ?? {},
    },
    update: { mediaShortcutsJson: mediaShortcuts ?? {}, status: "ready" },
  })

  const prefix = { orgId: payload.orgId, callId: payload.callId, recordingId: payload.recallRecordingId }
  const shortcuts = {
    video_mixed: getShortcutUrl(mediaShortcuts, "video_mixed"),
    audio_mixed: getShortcutUrl(mediaShortcuts, "audio_mixed"),
    transcript: getShortcutUrl(mediaShortcuts, "transcript"),
    participant_events: getShortcutUrl(mediaShortcuts, "participant_events"),
    meeting_metadata: getShortcutUrl(mediaShortcuts, "meeting_metadata"),
  }

  const required = [
    { key: "video_mixed", bucket: serverEnv.STORAGE_BUCKET_CALL_MEDIA, filename: "video_mixed.mp4" },
    { key: "audio_mixed", bucket: serverEnv.STORAGE_BUCKET_CALL_MEDIA, filename: "audio_mixed.mp3" },
    { key: "transcript", bucket: serverEnv.STORAGE_BUCKET_CALL_TRANSCRIPTS, filename: "transcript.json" },
  ] as const

  const optional = [
    { key: "participant_events", bucket: serverEnv.STORAGE_BUCKET_CALL_ARTIFACTS, filename: "participant_events.json" },
    { key: "meeting_metadata", bucket: serverEnv.STORAGE_BUCKET_CALL_ARTIFACTS, filename: "meeting_metadata.json" },
  ] as const

  for (const item of [...required, ...optional]) {
    const url = shortcuts[item.key]
    if (!url) {
      if (required.some((r) => r.key === item.key)) {
        throw new Error(`Recall recording missing required media_shortcuts.${item.key}.url`)
      }
      continue
    }
    const key = callRecordingObjectKey({ ...prefix, filename: item.filename })
    await ensureMediaAssetVerified(prisma, { callId: payload.callId, bucket: item.bucket, key, type: item.key, downloadUrl: url })
  }

  await deleteRecording(payload.recallRecordingId)
  await prisma.recallRecording.update({
    where: { recallRecordingId: payload.recallRecordingId },
    data: { recallDeletedAt: new Date(), status: "deleted" },
  })

  await enqueueJob({
    orgId: payload.orgId,
    callId: payload.callId,
    type: JobType.ANALYZE_CALL,
    payload: { orgId: payload.orgId, callId: payload.callId },
    dedupeKey: `analyze:${payload.callId}`,
  })
}

async function ensureTranscriptRows(prisma: PrismaClient, callId: string) {
  const existing = await prisma.transcript.findFirst({
    where: { callId },
    orderBy: { createdAt: "desc" },
    include: { segments: { take: 1 } },
  })
  if (existing?.segments?.length) return existing

  const asset = await prisma.mediaAsset.findFirst({
    where: { callId, type: "transcript" },
    orderBy: { createdAt: "desc" },
  })
  if (!asset) throw new Error("No transcript asset found for call")

  const buf = await downloadObjectToBuffer({ bucket: asset.bucket, key: asset.path })
  const json = JSON.parse(buf.toString("utf8")) as unknown

  const segmentsCandidate = asObject(json)?.segments ?? json
  const segmentsArray = Array.isArray(segmentsCandidate) ? segmentsCandidate : []

  const normalized = segmentsArray
    .map((s) => {
      const o = asObject(s)
      if (!o) return null
      const text = typeof o.text === "string" ? o.text : typeof o.transcript === "string" ? o.transcript : ""
      const startMs =
        typeof o.start_ms === "number"
          ? o.start_ms
          : typeof o.start === "number"
            ? Math.round(o.start * 1000)
            : typeof o.startMs === "number"
              ? o.startMs
              : 0
      const endMs =
        typeof o.end_ms === "number"
          ? o.end_ms
          : typeof o.end === "number"
            ? Math.round(o.end * 1000)
            : typeof o.endMs === "number"
              ? o.endMs
              : startMs
      const speakerLabel = typeof o.speaker === "string" ? o.speaker : typeof o.speaker_label === "string" ? o.speaker_label : "Speaker"
      return { speakerLabel, startMs, endMs, text: text.trim() }
    })
    .filter((s): s is NonNullable<typeof s> => !!s && !!s.text)

  const textPreview = normalized.map((s) => s.text).join(" ").slice(0, 280)
  const speakerLabels = [...new Set(normalized.map((s) => s.speakerLabel))]

  return prisma.$transaction(async (tx) => {
    const transcript = await tx.transcript.create({
      data: { callId, rawJsonJson: json as never, textPreview },
    })
    for (const seg of normalized) {
      await tx.transcriptSegment.create({
        data: {
          callId,
          transcriptId: transcript.id,
          speakerLabel: seg.speakerLabel,
          speakerRole: SpeakerRole.OTHER,
          startMs: seg.startMs,
          endMs: seg.endMs,
          text: seg.text,
        },
      })
    }

    for (const label of speakerLabels) {
      await tx.participant.upsert({
        where: { callId_speakerLabel: { callId, speakerLabel: label } },
        create: { callId, speakerLabel: label, speakerRole: SpeakerRole.OTHER, name: label },
        update: {},
      })
    }
    return transcript
  })
}

async function analyzeCall(prisma: PrismaClient, payload: AnalyzeCallPayload) {
  await ensureTranscriptRows(prisma, payload.callId)
  await analyzeCallWithOpenAI(prisma, payload.callId)
  await prisma.call.update({ where: { id: payload.callId }, data: { status: CallStatus.READY } })
}

export async function processJob(prisma: PrismaClient, job: Job) {
  const payload = job.payloadJson as unknown
  if (job.type === JobType.FINALIZE_RECORDING) {
    const p = payload as FinalizeRecordingPayload
    return finalizeRecording(prisma, p)
  }
  if (job.type === JobType.ANALYZE_CALL) {
    const p = payload as AnalyzeCallPayload
    return analyzeCall(prisma, p)
  }
  if (job.type === JobType.RECONCILE_INCOMPLETE_CALLS) {
    // Best-effort reconciliation: enqueue finalize for calls missing transcript while within retention.
    const sinceHours = serverEnv.RECALL_RETENTION_HOURS
    const cutoff = new Date(Date.now() - sinceHours * 60 * 60 * 1000)
    const calls = await prisma.call.findMany({
      where: { status: CallStatus.PROCESSING, createdAt: { gte: cutoff } },
      take: 25,
      select: { id: true, orgId: true, recordings: { take: 1, orderBy: { createdAt: "desc" }, select: { recallRecordingId: true } } },
    })
    for (const call of calls) {
      const recordingId = call.recordings[0]?.recallRecordingId
      if (!recordingId) continue
      const dedupeKey = `finalize:${recordingId}`
      await prisma.job.create({
        data: {
          orgId: call.orgId,
          callId: call.id,
          type: JobType.FINALIZE_RECORDING,
          payloadJson: { orgId: call.orgId, callId: call.id, recallRecordingId: recordingId },
          status: JobStatus.PENDING,
          dedupeKey,
          runAt: new Date(),
        },
      }).catch(() => {})
    }
    return
  }

  const hash = createHash("sha256").update(JSON.stringify(job.payloadJson)).digest("hex").slice(0, 12)
  throw new Error(`Unhandled job type ${job.type} (${hash})`)
}
