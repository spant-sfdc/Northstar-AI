import { z } from "zod"
import { getOpenAIClient } from "@/lib/ai/client"

const ADJUST_MODEL = "gpt-4o-mini"

const WeeklyAdjustSchema = z.object({
  summary:       z.string(),          // 2–3 sentences on what the data signals
  adjustments:   z.array(z.string()), // 2–3 concrete roadmap tweaks for next week
  nextWeekFocus: z.string(),          // single skill/area to double down on
  encouragement: z.string(),          // one honest, specific sentence
})

export type WeeklyAdjustFeedback = z.infer<typeof WeeklyAdjustSchema>

export async function generateWeeklyAdjustment(input: {
  targetRole: string
  weekNumber: number
  completedMilestoneTitles: string[]
  totalMilestonesThisWeek: number
  confidenceScore: number
  wins: string | null
  blockers: string | null
}): Promise<WeeklyAdjustFeedback> {
  const client = getOpenAIClient()

  const completedCount = input.completedMilestoneTitles.length
  const completionRate = input.totalMilestonesThisWeek > 0
    ? Math.round((completedCount / input.totalMilestonesThisWeek) * 100)
    : 0

  const userMessage = [
    `Target role: ${input.targetRole}`,
    `Week: ${input.weekNumber}`,
    `Milestone completion: ${completedCount}/${input.totalMilestonesThisWeek} (${completionRate}%)`,
    `Confidence this week: ${input.confidenceScore}/10`,
    completedCount > 0
      ? `Completed: ${input.completedMilestoneTitles.join("; ")}`
      : "Completed: none",
    input.wins     ? `Wins: ${input.wins}`     : null,
    input.blockers ? `Blockers: ${input.blockers}` : null,
  ].filter(Boolean).join("\n")

  const completion = await client.chat.completions.create({
    model: ADJUST_MODEL,
    temperature: 0.4,
    max_tokens: 400,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior tech career coach reviewing a weekly check-in for someone preparing for ${input.targetRole} interviews.

Analyze the check-in data and respond with a JSON object containing:
- "summary": 2–3 sentences analyzing what the data signals about their trajectory. Be honest about under-performance; don't sugar-coat.
- "adjustments": array of 2–3 specific, actionable changes to their routine for next week. Not generic advice — concrete shifts.
- "nextWeekFocus": one skill or area they should prioritize most next week (one sentence).
- "encouragement": one genuine, specific sentence that acknowledges their actual effort without being hollow.

Rules:
- If completion rate < 50%: surface the gap directly in summary.
- If confidence < 4: address the confidence blocker specifically in adjustments.
- If no blockers provided: still suggest one area to watch.
- Never use "keep it up" or generic motivational language.`,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
  })

  const raw = completion.choices[0]?.message?.content ?? "{}"
  const parsed = JSON.parse(raw)
  return WeeklyAdjustSchema.parse(parsed)
}
