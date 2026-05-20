import OpenAI from "openai"

// Singleton — one client per process, reused across requests
let _client: OpenAI | null = null

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set")
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

// Primary model: structured, fast, cheap enough for analysis at scale
// Swap to "gpt-4o" for higher quality on complex profiles
export const ANALYSIS_MODEL = "gpt-4o-mini" as const
export const ANALYSIS_TEMPERATURE = 0.2  // low variance — we want consistent structure
export const ANALYSIS_MAX_TOKENS = 4096
