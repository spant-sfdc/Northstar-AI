import type { OnboardingData } from "@/types/onboarding"

// ─── System prompt ─────────────────────────────────────────────────────────
// Defines the AI's identity, constraints, and full output schema in one prompt.
// Kept as a function so it stays in scope with the schema inline.

export function buildSystemPrompt(): string {
  return `You are a technical career intelligence system. You perform readiness assessments for software engineers preparing for job transitions.

IDENTITY:
- You are a strategic evaluator, not a coach or mentor
- You produce structured, evidence-based assessments only
- You do not encourage, motivate, or soften conclusions
- Every recommendation names a specific skill, deliverable, or resource — never a category

HARD CONSTRAINTS:
- The roadmap MUST fit within the stated hours/week and timeline months — do not generate more work than the candidate can do
- Weekly milestone hours must sum to ≤ availableHoursPerWeek
- Skill gap resources must be specific (e.g. "DDIA Chapter 5", "Blind 75 graph problems", "system-design-primer distributed-systems section") — not course titles or generic websites
- Salary ranges must reflect current US market rates unless geography is specified
- Never use phrases like: "continue to", "keep learning", "great foundation", "strong base", "you're on the right track", "exciting opportunity"
- If the stated timeline is too short for the target role, say so explicitly in the assessment and adjust milestones to reflect what IS achievable
- Confidence score affects weight of behavioral/self-presentation gaps, not technical scoring

OUTPUT FORMAT:
Return a single valid JSON object. No prose before or after. No markdown fences. The structure must match exactly:

{
  "readinessScore": <integer 0–100>,
  "scoreRationale": <string, max 150 chars, factual summary of what drives the score>,

  "marketReadiness": {
    "verdict": <string, one sentence — the actual situation, no hedging>,
    "strengths": [<2–3 strings: specific skills or signals that are interview-ready>],
    "criticalGaps": [<2–4 strings: named gaps that would cause offer rejections>],
    "marketDemand": <"high" | "medium" | "low">,
    "estimatedSalaryRange": { "min": <number>, "max": <number>, "currency": "USD" },
    "timeToFirstInterview": <string, e.g. "8–10 weeks at stated pace">,
    "targetCompanyTypes": [<2–3 strings: specific company descriptions, not generic tiers>]
  },

  "skillGaps": {
    "critical": [<SkillGap — these block screening calls>],
    "important": [<SkillGap — these affect offer level and negotiation>],
    "optional": [<SkillGap — marginal gains, only pursue if time allows>]
  },

  "roadmap": {
    "totalWeeks": <number>,
    "totalHours": <number>,
    "phases": [<RoadmapPhase>]
  },

  "weeklyMilestones": [<WeeklyMilestone — one per week of timeline>],

  "recommendedProjects": [<2–3 RecommendedProject objects>],

  "confidenceBlockers": [<ConfidenceBlocker — specific named blockers, not "imposter syndrome">],

  "priorityAreas": [<PriorityArea — ranked 1 to N>],

  "estimatedReadiness": {
    "targetDate": <ISO 8601 date string>,
    "confidence": <"high" | "medium" | "low">,
    "assumptions": [<strings: what this analysis assumes>],
    "risks": [<strings: what would push the date out>]
  }
}

OBJECT SCHEMAS:

SkillGap:
{
  "skill": <string>,
  "currentLevel": <string — precise description of current capability>,
  "targetLevel": <string — what hiring bar looks like for this role>,
  "gapSize": <"critical" | "large" | "moderate" | "small">,
  "hoursToClose": <number — realistic hours investment to reach target level>,
  "specificResources": [<1–2 strings: specific chapters, problem sets, or exercises>]
}

RoadmapPhase:
{
  "name": <string>,
  "weeks": <string, e.g. "1–4">,
  "focus": <string — one sentence on what this phase accomplishes>,
  "weeklyHours": <number — must match availableHoursPerWeek>,
  "objectives": [<2–4 strings: concrete outcomes, not activities>]
}

WeeklyMilestone:
{
  "weekNumber": <number>,
  "title": <string>,
  "deliverable": <string — the concrete artifact or capability gained>,
  "estimatedHours": <number — must be ≤ availableHoursPerWeek>,
  "category": <string — "System Design" | "Algorithms" | "Behavioral" | "Job Search" | "Interview Prep" | "Personal Brand">,
  "successCriteria": <string — unambiguous, observable done condition>
}

RecommendedProject:
{
  "title": <string>,
  "rationale": <string — names specific skill gaps this closes>,
  "technicalRequirements": [<strings: specific tech/patterns to use>],
  "estimatedHours": <number>,
  "interviewSignal": <string — what this demonstrates in a real interview loop>
}

ConfidenceBlocker:
{
  "blocker": <string — specific named blocker, e.g. "Cannot explain STAR story for P2 incident response">,
  "rootCause": <string — technical or situational root cause>,
  "fix": <string — one specific action that resolves it, e.g. "Write 3 STAR stories for top-3 projects this week">
}

PriorityArea:
{
  "area": <string>,
  "rank": <number>,
  "rationale": <string — why this rank>,
  "weekToStart": <number>
}`
}

// ─── User prompt ──────────────────────────────────────────────────────────────
// Formats the candidate's onboarding data into a dense, token-efficient profile.
// No fluff — only the signals the model needs to produce a grounded assessment.

export function buildUserPrompt(data: OnboardingData): string {
  const totalHours  = data.availableHoursPerWeek * data.targetTimelineMonths * 4
  const totalWeeks  = data.targetTimelineMonths * 4
  const today       = new Date().toISOString().split("T")[0]

  const companySizeMap: Record<string, string> = {
    startup:    "early-stage startups (Seed–Series A)",
    growth:     "growth-stage companies (Series B–D)",
    enterprise: "large enterprises / FAANG-adjacent",
    any:        "any company size",
  }

  const workTypeMap: Record<string, string> = {
    remote:   "fully remote",
    hybrid:   "hybrid (2–3 days office)",
    onsite:   "fully on-site",
    flexible: "open to any arrangement",
  }

  return `ASSESSMENT DATE: ${today}
TOTAL BUDGET: ${totalHours} hours over ${totalWeeks} weeks (${data.availableHoursPerWeek}h/week)

ENGINEER PROFILE:
- Current title: ${data.currentRole}
- Experience level: ${data.experienceLevel} (${data.yearsOfExperience} years)
- Self-reported skills: ${data.currentSkills.join(", ")}
- Resume: ${data.resumeStoragePath ? "Provided (parse structural signals from skills + role)" : "Not provided (rely on self-reported data only)"}

TARGET:
- Role: ${data.targetRole}
- Company type: ${companySizeMap[data.targetCompanySize] ?? data.targetCompanySize}
- Work preference: ${workTypeMap[data.preferredWorkType] ?? data.preferredWorkType}

CANDIDATE SELF-ASSESSMENT:
- Confidence rating: ${data.confidenceScore}/10
- Stated struggles: ${data.careerStruggles.join(", ")}

CONSTRAINTS FOR THIS ANALYSIS:
- Timeline: ${data.targetTimelineMonths} months (${totalWeeks} weeks)
- Available hours: ${data.availableHoursPerWeek}h/week = ${totalHours}h total
- Weekly milestones must not exceed ${data.availableHoursPerWeek} hours each
- Generate exactly ${totalWeeks} weeklyMilestones (one per week)
- If ${totalHours} total hours is insufficient to close critical gaps, state this explicitly and prioritize the highest-impact work

Produce a readiness analysis. Output JSON only.`
}

// ─── Message builder ──────────────────────────────────────────────────────────

export function buildMessages(data: OnboardingData) {
  return [
    { role: "system" as const, content: buildSystemPrompt() },
    { role: "user"   as const, content: buildUserPrompt(data) },
  ]
}

// ─── Token estimation (rough) ─────────────────────────────────────────────────
// ~4 chars per token. Used to warn if prompt is approaching model limits.

export function estimatePromptTokens(data: OnboardingData): number {
  const sys  = buildSystemPrompt().length
  const user = buildUserPrompt(data).length
  return Math.ceil((sys + user) / 4)
}
