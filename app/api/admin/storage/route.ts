import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const assets = await prisma.mediaAsset.findMany({
    where: { call: { orgId: ctx.org.id } },
    select: { type: true, sizeBytes: true },
  })

  const totals = {
    totalBytes: 0n,
    videoBytes: 0n,
    audioBytes: 0n,
    transcriptBytes: 0n,
    otherBytes: 0n,
  }

  for (const a of assets) {
    const size = a.sizeBytes ?? 0n
    totals.totalBytes += size
    if (a.type.includes("video")) totals.videoBytes += size
    else if (a.type.includes("audio")) totals.audioBytes += size
    else if (a.type.includes("transcript")) totals.transcriptBytes += size
    else totals.otherBytes += size
  }

  const callCount = await prisma.call.count({ where: { orgId: ctx.org.id } })

  const callSizes = await prisma.call.findMany({
    where: { orgId: ctx.org.id },
    select: {
      id: true,
      title: true,
      scheduledAt: true,
      mediaAssets: { select: { sizeBytes: true } },
    },
  })
  const largestCalls = callSizes
    .map((c) => ({
      id: c.id,
      title: c.title,
      date: c.scheduledAt.toISOString().slice(0, 10),
      sizeBytes: c.mediaAssets.reduce((acc, a) => acc + Number(a.sizeBytes ?? 0n), 0),
    }))
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, 10)

  return NextResponse.json({
    data: {
      ...Object.fromEntries(Object.entries(totals).map(([k, v]) => [k, Number(v)])),
      callCount,
      largestCalls,
    },
  })
}
