import "server-only"

import { serverEnv } from "@/src/lib/env"
import { prisma } from "@/src/lib/prisma"
import { hmacSha256Base64Url, sha256Hex, safeEqual } from "@/src/lib/security/crypto"

export type EmbedScope = "call" | "client"

export type EmbedTokenPayload = {
  orgId: string
  scope: EmbedScope
  resourceId: string
  exp: number
  iat: number
}

export async function createEmbedToken(opts: { orgId: string; scope: EmbedScope; resourceId: string; expiresAt: Date }) {
  const payload: EmbedTokenPayload = {
    orgId: opts.orgId,
    scope: opts.scope,
    resourceId: opts.resourceId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(opts.expiresAt.getTime() / 1000),
  }

  const body = Buffer.from(JSON.stringify(payload)).toString("base64url")
  const sig = hmacSha256Base64Url(serverEnv.EMBED_TOKEN_SECRET, body)
  const token = `${body}.${sig}`

  await prisma.embedToken.create({
    data: {
      orgId: opts.orgId,
      scope: opts.scope,
      resourceId: opts.resourceId,
      tokenHash: sha256Hex(token),
      expiresAt: opts.expiresAt,
    },
  })

  return token
}

export async function verifyEmbedToken(token: string) {
  const [body, sig] = token.split(".")
  if (!body || !sig) throw new Error("Invalid token format")

  const expected = hmacSha256Base64Url(serverEnv.EMBED_TOKEN_SECRET, body)
  if (!safeEqual(expected, sig)) throw new Error("Invalid token signature")

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as EmbedTokenPayload
  if (!payload || typeof payload.orgId !== "string") throw new Error("Invalid token payload")

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) throw new Error("Token expired")

  const record = await prisma.embedToken.findFirst({
    where: { tokenHash: sha256Hex(token), revokedAt: null },
    select: { id: true, expiresAt: true, orgId: true, scope: true, resourceId: true },
  })
  if (!record) throw new Error("Token revoked or not found")
  if (record.expiresAt.getTime() / 1000 < now) throw new Error("Token expired")

  return payload
}

