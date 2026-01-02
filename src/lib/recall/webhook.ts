import { Webhook } from "svix"

export function verifySvixWebhook(opts: {
  rawBody: string
  headers: Record<string, string | null | undefined>
  signingSecret: string
  toleranceSeconds: number
}) {
  const svixId = opts.headers["svix-id"]
  const svixTimestamp = opts.headers["svix-timestamp"]
  const svixSignature = opts.headers["svix-signature"]
  if (!svixId || !svixTimestamp || !svixSignature) throw new Error("Missing Svix headers")

  const ts = Number.parseInt(String(svixTimestamp), 10)
  if (!Number.isFinite(ts)) throw new Error("Invalid Svix timestamp")

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (Math.abs(nowSeconds - ts) > opts.toleranceSeconds) throw new Error("Svix timestamp outside tolerance")

  const wh = new Webhook(opts.signingSecret)
  wh.verify(opts.rawBody, { "svix-id": svixId, "svix-timestamp": String(svixTimestamp), "svix-signature": svixSignature })

  return JSON.parse(opts.rawBody) as unknown
}
