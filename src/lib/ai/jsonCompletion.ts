import "server-only"

import type { ChatCompletionMessageParam } from "openai/resources/chat/completions"
import { z } from "zod"
import { openai } from "@/src/lib/ai/openai"

export async function createJsonCompletion<T extends z.ZodTypeAny>(opts: {
  model: "gpt-5-nano" | "gpt-5-mini" | "gpt-5.1"
  messages: ChatCompletionMessageParam[]
  schema: T
  temperature?: number
}) {
  const resp = await openai.chat.completions.create({
    model: opts.model,
    messages: opts.messages,
    temperature: opts.temperature ?? 0.2,
    response_format: { type: "json_object" },
  })

  const content = resp.choices[0]?.message?.content
  if (!content) throw new Error("OpenAI returned empty content")

  let parsed: unknown
  try {
    parsed = JSON.parse(content)
  } catch (e) {
    throw new Error(`OpenAI returned non-JSON content: ${content.slice(0, 180)}`)
  }

  return {
    value: opts.schema.parse(parsed),
    model: opts.model,
    usage: (resp as unknown as { usage?: unknown }).usage ?? null,
  }
}

