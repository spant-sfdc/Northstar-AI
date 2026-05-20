import type { OnboardingData } from "@/types/onboarding"
import { getOpenAIClient, ANALYSIS_MODEL, ANALYSIS_TEMPERATURE, ANALYSIS_MAX_TOKENS } from "./client"
import { buildMessages, estimatePromptTokens } from "./prompts"
import { ReadinessAnalysisSchema, AIParseError, AIServiceError } from "./schemas"
import type { ReadinessAnalysis } from "./schemas"

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

// Retryable OpenAI status codes
const RETRYABLE_CODES = new Set([429, 500, 502, 503, 504])

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function analyzeReadiness(data: OnboardingData): Promise<ReadinessAnalysis> {
  const estimatedTokens = estimatePromptTokens(data)
  if (estimatedTokens > 12000) {
    throw new AIServiceError(
      `Prompt too large: ~${estimatedTokens} tokens. Reduce skill count or struggle descriptions.`,
      "PROMPT_TOO_LARGE",
      false,
    )
  }

  const client   = getOpenAIClient()
  const messages = buildMessages(data)

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model:           ANALYSIS_MODEL,
        messages,
        temperature:     ANALYSIS_TEMPERATURE,
        max_tokens:      ANALYSIS_MAX_TOKENS,
        response_format: { type: "json_object" },
      })

      const raw = completion.choices[0]?.message?.content
      if (!raw) {
        throw new AIParseError("Empty response from model", "", attempt)
      }

      let parsed: unknown
      try {
        parsed = JSON.parse(raw)
      } catch {
        throw new AIParseError("Model returned non-JSON content", raw, attempt)
      }

      const result = ReadinessAnalysisSchema.safeParse(parsed)
      if (!result.success) {
        const issues = result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")
        throw new AIParseError(`Schema validation failed: ${issues}`, raw, attempt)
      }

      return result.data

    } catch (err) {
      // AIParseError: only retry if we have retries left and it's not a schema issue
      // (schema issues on last attempt become hard failures)
      if (err instanceof AIParseError) {
        lastError = err
        if (attempt < MAX_RETRIES) {
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
          continue
        }
        throw err
      }

      // OpenAI SDK errors
      if (err && typeof err === "object" && "status" in err) {
        const status  = (err as { status: number }).status
        const message = (err as { message?: string }).message ?? "OpenAI API error"
        const retryable = RETRYABLE_CODES.has(status)

        if (retryable && attempt < MAX_RETRIES) {
          lastError = new AIServiceError(message, String(status), true)
          await sleep(BASE_DELAY_MS * Math.pow(2, attempt - 1))
          continue
        }

        throw new AIServiceError(message, String(status), retryable)
      }

      // Unknown errors — don't retry
      throw err
    }
  }

  // Should not reach here, but TypeScript needs a return path
  throw lastError ?? new AIServiceError("Analysis failed after retries", "UNKNOWN", false)
}
