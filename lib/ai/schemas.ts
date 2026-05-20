import { z } from "zod"

// ─── Sub-schemas ─────────────────────────────────────────────────────────────

export const SkillGapSchema = z.object({
  skill:             z.string(),
  currentLevel:      z.string(),   // e.g. "Can implement basic BFS but breaks on follow-ups"
  targetLevel:       z.string(),   // e.g. "Can design and explain graph traversal for distributed systems"
  gapSize:           z.enum(["critical", "large", "moderate", "small"]),
  hoursToClose:      z.number(),
  specificResources: z.array(z.string()),  // max 2: book chapters, specific problem sets
})

export const RoadmapPhaseSchema = z.object({
  name:        z.string(),
  weeks:       z.string(),         // e.g. "1–4"
  focus:       z.string(),
  weeklyHours: z.number(),
  objectives:  z.array(z.string()),
})

export const WeeklyMilestoneSchema = z.object({
  weekNumber:      z.number(),
  title:           z.string(),
  deliverable:     z.string(),     // concrete output: "can explain X to an interviewer", "built Y", "solved Z"
  estimatedHours:  z.number(),
  category:        z.string(),
  successCriteria: z.string(),     // unambiguous done condition
})

export const RecommendedProjectSchema = z.object({
  title:                  z.string(),
  rationale:              z.string(),  // why this project closes specific gaps
  technicalRequirements:  z.array(z.string()),
  estimatedHours:         z.number(),
  interviewSignal:        z.string(),  // what this demonstrates in a real interview loop
})

export const ConfidenceBlockerSchema = z.object({
  blocker:   z.string(),
  rootCause: z.string(),
  fix:       z.string(),  // specific action, not generic advice
})

export const PriorityAreaSchema = z.object({
  area:        z.string(),
  rank:        z.number(),
  rationale:   z.string(),
  weekToStart: z.number(),
})

// ─── Root schema ─────────────────────────────────────────────────────────────

export const ReadinessAnalysisSchema = z.object({
  readinessScore: z.number().min(0).max(100),
  scoreRationale: z.string(),  // ≤150 chars, factual — no encouragement

  marketReadiness: z.object({
    verdict:          z.string(),  // one sentence: the actual situation
    strengths:        z.array(z.string()),  // 2–3 specific strengths (skills/signals, not traits)
    criticalGaps:     z.array(z.string()),  // 2–4 named gaps that block offers
    marketDemand:     z.enum(["high", "medium", "low"]),
    estimatedSalaryRange: z.object({
      min:      z.number(),
      max:      z.number(),
      currency: z.string(),
    }),
    timeToFirstInterview: z.string(),  // e.g. "8–10 weeks at stated pace"
    targetCompanyTypes:   z.array(z.string()),  // 2–3 specific company descriptions
  }),

  skillGaps: z.object({
    critical:  z.array(SkillGapSchema),  // must close to clear screens
    important: z.array(SkillGapSchema),  // differentiates offers
    optional:  z.array(SkillGapSchema),  // marginal gains
  }),

  roadmap: z.object({
    totalWeeks:  z.number(),
    totalHours:  z.number(),
    phases:      z.array(RoadmapPhaseSchema),
  }),

  weeklyMilestones:    z.array(WeeklyMilestoneSchema),
  recommendedProjects: z.array(RecommendedProjectSchema),
  confidenceBlockers:  z.array(ConfidenceBlockerSchema),
  priorityAreas:       z.array(PriorityAreaSchema),

  estimatedReadiness: z.object({
    targetDate:  z.string(),  // ISO date
    confidence:  z.enum(["high", "medium", "low"]),
    assumptions: z.array(z.string()),  // what this analysis assumes about the candidate
    risks:       z.array(z.string()),  // what would push the date out
  }),
})

// ─── Derived types ────────────────────────────────────────────────────────────

export type ReadinessAnalysis    = z.infer<typeof ReadinessAnalysisSchema>
export type SkillGap             = z.infer<typeof SkillGapSchema>
export type RoadmapPhase         = z.infer<typeof RoadmapPhaseSchema>
export type WeeklyMilestone      = z.infer<typeof WeeklyMilestoneSchema>
export type RecommendedProject   = z.infer<typeof RecommendedProjectSchema>
export type ConfidenceBlocker    = z.infer<typeof ConfidenceBlockerSchema>
export type PriorityArea         = z.infer<typeof PriorityAreaSchema>

// ─── Error types ──────────────────────────────────────────────────────────────

export class AIParseError extends Error {
  constructor(
    message: string,
    public readonly rawOutput: string,
    public readonly attempt: number,
  ) {
    super(message)
    this.name = "AIParseError"
  }
}

export class AIServiceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean,
  ) {
    super(message)
    this.name = "AIServiceError"
  }
}
