import "server-only"

import { serverEnv } from "@/src/lib/env"

export function pickModelSimple() {
  return serverEnv.OPENAI_MODEL_SIMPLE
}

export function pickModelMedium() {
  return serverEnv.OPENAI_MODEL_MEDIUM
}

export function pickModelComplex() {
  return serverEnv.OPENAI_MODEL_COMPLEX
}

