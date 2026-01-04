import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireOrgContext } from "@/src/lib/auth/context"
import { toUiTranscriptSegments } from "@/src/lib/ui/mappers"

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function pad3(n: number) {
  return String(n).padStart(3, "0")
}

function toSrtTimestamp(ms: number) {
  const safe = Math.max(0, ms)
  const hours = Math.floor(safe / 3_600_000)
  const minutes = Math.floor((safe % 3_600_000) / 60_000)
  const seconds = Math.floor((safe % 60_000) / 1000)
  const millis = safe % 1000
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)},${pad3(millis)}`
}

export async function GET(request: Request, context: { params: Promise<{ callId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const url = new URL(request.url)
  const format = (url.searchParams.get("format") ?? "json").toLowerCase()
  const download = url.searchParams.get("download") === "1" || url.searchParams.get("download") === "true"

  const { callId } = await context.params
  const call = await prisma.call.findFirst({ where: { id: callId, orgId: ctx.org.id }, select: { id: true } })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  const segments = await prisma.transcriptSegment.findMany({
    where: { callId },
    select: { id: true, speakerLabel: true, speakerRole: true, startMs: true, endMs: true, text: true },
    orderBy: { startMs: "asc" },
  })

  const uiSegments = toUiTranscriptSegments(segments)

  if (format === "json") {
    if (!download) return NextResponse.json({ data: uiSegments })
    const body = JSON.stringify(uiSegments, null, 2)
    return new Response(body, {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="transcript-${callId}.json"`,
      },
    })
  }

  if (format === "txt") {
    const lines = uiSegments.map((s) => {
      const mins = Math.floor(s.startMs / 60000)
      const secs = Math.floor((s.startMs % 60000) / 1000)
      const ts = `${pad2(mins)}:${pad2(secs)}`
      const who = s.speakerLabel || "Speaker"
      return `[${ts}] ${who}: ${s.text}`.trim()
    })
    const body = lines.join("\n")
    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="transcript-${callId}.txt"`,
      },
    })
  }

  if (format === "srt") {
    const blocks = uiSegments.map((s, idx) => {
      const start = toSrtTimestamp(s.startMs)
      const end = toSrtTimestamp(Math.max(s.endMs, s.startMs + 1))
      const who = s.speakerLabel || "Speaker"
      const text = `${who}: ${s.text}`.trim()
      return `${idx + 1}\n${start} --> ${end}\n${text}\n`
    })
    const body = blocks.join("\n")
    return new Response(body, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "content-disposition": `attachment; filename="transcript-${callId}.srt"`,
      },
    })
  }

  return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid format" } }, { status: 400 })
}
