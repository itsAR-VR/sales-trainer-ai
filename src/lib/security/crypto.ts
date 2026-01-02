import "server-only"

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export function sha256Hex(input: string) {
  return createHash("sha256").update(input, "utf8").digest("hex")
}

export function randomToken(bytes = 24) {
  return randomBytes(bytes).toString("base64url")
}

export function hmacSha256Base64Url(secret: string, data: string) {
  return createHmac("sha256", secret).update(data, "utf8").digest("base64url")
}

export function safeEqual(a: string, b: string) {
  const aBuf = Buffer.from(a)
  const bBuf = Buffer.from(b)
  if (aBuf.length !== bBuf.length) return false
  return timingSafeEqual(aBuf, bBuf)
}

