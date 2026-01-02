import { NextResponse } from "next/server"
import { requireOrgContext } from "@/src/lib/auth/context"
import { prisma } from "@/lib/prisma"
import { getSignedDownloadUrl } from "@/src/lib/storage/s3"

export async function GET(request: Request, context: { params: Promise<{ callId: string }> }) {
  const ctx = await requireOrgContext()
  if (!ctx.ok) return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "Not signed in" } }, { status: 401 })

  const { callId } = await context.params
  const url = new URL(request.url)
  const type = url.searchParams.get("type") ?? "video_mixed"

  const call = await prisma.call.findFirst({ where: { id: callId, orgId: ctx.org.id }, select: { id: true } })
  if (!call) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Call not found" } }, { status: 404 })

  const asset = await prisma.mediaAsset.findFirst({
    where: { callId, type, verifiedAt: { not: null } },
    orderBy: { createdAt: "desc" },
  })
  if (!asset) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Playback asset not ready" } }, { status: 404 })

  const signedUrl = await getSignedDownloadUrl({ bucket: asset.bucket, key: asset.path, expiresSeconds: 60 * 10 })
  return NextResponse.json({ data: { url: signedUrl } })
}

