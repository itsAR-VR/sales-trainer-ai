import "server-only"

import OpenAI from "openai"
import { serverEnv } from "@/src/lib/env"

export const openai = new OpenAI({ apiKey: serverEnv.OPENAI_API_KEY })

