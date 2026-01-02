import { describe, expect, it, vi } from "vitest"

vi.mock("svix", () => {
  return {
    Webhook: class {
      secret: string
      constructor(secret: string) {
        this.secret = secret
      }
      verify(rawBody: string, headers: any) {
        if (headers["svix-signature"] !== "ok") throw new Error("bad sig")
        return JSON.parse(rawBody)
      }
    },
  }
})

describe("verifySvixWebhook", () => {
  it("rejects missing headers", async () => {
    const { verifySvixWebhook } = await import("../src/lib/recall/webhook")
    expect(() =>
      verifySvixWebhook({
        rawBody: "{}",
        headers: {},
        signingSecret: "secret",
        toleranceSeconds: 10,
      }),
    ).toThrow(/Missing Svix headers/)
  })

  it("rejects timestamp outside tolerance", async () => {
    const { verifySvixWebhook } = await import("../src/lib/recall/webhook")
    const old = Math.floor(Date.now() / 1000) - 1000
    expect(() =>
      verifySvixWebhook({
        rawBody: "{}",
        headers: { "svix-id": "1", "svix-timestamp": String(old), "svix-signature": "ok" },
        signingSecret: "secret",
        toleranceSeconds: 1,
      }),
    ).toThrow(/outside tolerance/)
  })

  it("accepts valid signature and returns payload", async () => {
    const { verifySvixWebhook } = await import("../src/lib/recall/webhook")
    const now = Math.floor(Date.now() / 1000)
    const payload = { id: "evt_1", type: "recording.done", data: { recording_id: "rec_1" } }
    const out = verifySvixWebhook({
      rawBody: JSON.stringify(payload),
      headers: { "svix-id": "1", "svix-timestamp": String(now), "svix-signature": "ok" },
      signingSecret: "secret",
      toleranceSeconds: 60,
    })
    expect(out).toEqual(payload)
  })
})

