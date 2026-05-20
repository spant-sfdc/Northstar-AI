import type { ReadinessAnalysis } from "@/lib/ai/schemas"
import type {
  DashboardData,
  Milestone,
  SkillGap,
  RoadmapWeek,
  NextAction,
  ConfidencePoint,
} from "@/lib/mock-data"

// ─── Gap size → approximate current proficiency score (0–100) ─────────────────

const GAP_SIZE_SCORE: Record<string, number> = {
  critical: 18,
  large:    38,
  moderate: 60,
  small:    80,
}

// ─── Skill → breakdown bucket ─────────────────────────────────────────────────

type Bucket = "technical" | "design" | "behavioral" | "jobsearch"

function categorize(skill: string): Bucket {
  const s = skill.toLowerCase()
  if (/system|design|architect|distribut|infrastructure|scalab|database|api design|microservice/.test(s))
    return "design"
  if (/behavioral|leadership|communicat|collaborat|story|star|conflict|manag|present|stakeholder/.test(s))
    return "behavioral"
  if (/network|resume|negotiat|linkedin|job search|application|outreach|salary|recruiter/.test(s))
    return "jobsearch"
  return "technical"
}

// Average score for a bucket; defaults to 75 if no gaps exist for it
function bucketScore(
  gaps: ReadinessAnalysis["skillGaps"]["critical"],
  bucket: Bucket,
): number {
  const matching = gaps.filter(g => categorize(g.skill) === bucket)
  if (!matching.length) return 75
  const total = matching.reduce((sum, g) => sum + (GAP_SIZE_SCORE[g.gapSize] ?? 50), 0)
  return Math.round(total / matching.length)
}

// ─── Phase week range parser ─────────────────────────────────────────────────

function parseWeekRange(weeks: string): [number, number] {
  const parts = weeks.split(/[–\-]/).map(s => parseInt(s.trim(), 10))
  return [parts[0] ?? 1, parts[1] ?? parts[0] ?? 1]
}

// ─── Main mapper ──────────────────────────────────────────────────────────────

export function analysisToDisplay(
  analysis: ReadinessAnalysis,
  opts: {
    userName: string
    userEmail: string
    currentRole: string
    targetRole: string
    targetCompanySize: string
    timelineMonths: number
    availableHoursPerWeek: number
    confidenceScore: number
    submittedAt: string  // ISO string — used to compute current week number
  },
): DashboardData {
  const allGaps = [
    ...analysis.skillGaps.critical,
    ...analysis.skillGaps.important,
    ...analysis.skillGaps.optional,
  ]

  // ── Current week number ──────────────────────────────────────────────────
  const startDate   = new Date(opts.submittedAt)
  const msPerWeek   = 7 * 24 * 60 * 60 * 1000
  const weekNumber  = Math.max(1, Math.ceil((Date.now() - startDate.getTime()) / msPerWeek))

  // ── Readiness breakdown (4 buckets) ─────────────────────────────────────
  const readinessBreakdown = [
    { label: "Technical depth",    score: bucketScore(allGaps, "technical"),  weight: 35 },
    { label: "System design",      score: bucketScore(allGaps, "design"),     weight: 25 },
    { label: "Behavioral stories", score: bucketScore(allGaps, "behavioral"), weight: 20 },
    { label: "Job search posture", score: bucketScore(allGaps, "jobsearch"),  weight: 20 },
  ]

  // ── Milestones (first 10 from weeklyMilestones) ──────────────────────────
  const milestones: Milestone[] = analysis.weeklyMilestones
    .slice(0, 10)
    .map((m, i) => ({
      id:               String(i + 1),
      title:            m.title,
      weekNumber:       m.weekNumber,
      category:         m.category,
      estimatedMinutes: Math.round(m.estimatedHours * 60),
      status:
        m.weekNumber < weekNumber  ? "complete"    :
        m.weekNumber === weekNumber ? "in_progress" :
                                     "not_started",
    }))

  // ── Skill gaps display ───────────────────────────────────────────────────
  const priorityMap: Record<string, "high" | "medium" | "low"> = {
    critical: "high",
    large:    "high",
    moderate: "medium",
    small:    "low",
  }

  const skillGaps: SkillGap[] = allGaps.slice(0, 8).map(g => ({
    skill:    g.skill,
    current:  GAP_SIZE_SCORE[g.gapSize] ?? 50,
    target:   85,
    category: categorize(g.skill) === "technical"  ? "Technical"  :
              categorize(g.skill) === "design"      ? "Technical"  :
              categorize(g.skill) === "behavioral"  ? "Behavioral" :
                                                      "Career",
    priority: priorityMap[g.gapSize] ?? "medium",
  }))

  // ── Roadmap weeks (expand phases → individual weeks) ────────────────────
  const roadmapWeeks: RoadmapWeek[] = []
  for (const phase of analysis.roadmap.phases) {
    const [start, end] = parseWeekRange(phase.weeks)
    for (let w = start; w <= end; w++) {
      roadmapWeeks.push({
        week:           w,
        theme:          phase.name,
        milestoneCount: phase.objectives.length,
        focusArea:      phase.focus,
        status:
          w < weekNumber  ? "complete" :
          w === weekNumber ? "current"  :
                             "upcoming",
      })
    }
  }

  // ── Next actions from priority areas ────────────────────────────────────
  const categoryFromArea = (area: string): string => {
    const a = area.toLowerCase()
    if (/algorithm|coding|leetcode|ds/.test(a))      return "Algorithms"
    if (/system|design|architect/.test(a))            return "System Design"
    if (/behavioral|star|story/.test(a))              return "Behavioral"
    if (/job|apply|application|network|resume/.test(a)) return "Job Search"
    return "Interview Prep"
  }

  const nextActions: NextAction[] = analysis.priorityAreas.slice(0, 5).map(p => ({
    id:               String(p.rank),
    title:            p.rationale,
    priority:         p.rank === 1 ? "high" : p.rank <= 3 ? "medium" : "low",
    estimatedMinutes: 45,
    category:         categoryFromArea(p.area),
  }))

  // ── Confidence history (seed from onboarding score + endpoint projection) ─
  const startScore  = opts.confidenceScore
  const endScore    = Math.min(10, startScore + 2)
  const confidenceHistory: ConfidencePoint[] = [
    { label: "Start", score: startScore },
    { label: "Now",   score: startScore },   // will grow as user checks in
    { label: "Target",score: endScore   },
  ]

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalWeeks       = analysis.roadmap.totalWeeks
  const targetDate       = new Date(analysis.estimatedReadiness.targetDate)
  const daysUntilReady   = Math.max(0, Math.round((targetDate.getTime() - Date.now()) / 86400000))
  const milestonesTotal  = analysis.weeklyMilestones.length
  const milestonesCompleted = analysis.weeklyMilestones.filter(m => m.weekNumber < weekNumber).length

  // Weekly progress: blank until real checkin data exists
  const weeklyProgress = Array.from({ length: Math.min(weekNumber, 8) }, (_, i) => ({
    week:      `W${i + 1}`,
    hours:     i + 1 < weekNumber ? opts.availableHoursPerWeek : 0,
    completed: 0,
    target:    opts.availableHoursPerWeek,
  }))

  return {
    user: {
      name:              opts.userName,
      email:             opts.userEmail,
      currentRole:       opts.currentRole,
      targetRole:        opts.targetRole,
      targetCompanySize: opts.targetCompanySize,
      timelineMonths:    opts.timelineMonths,
      weekNumber,
      startDate:         opts.submittedAt.split("T")[0],
    },
    readinessScore:    analysis.readinessScore,
    readinessBreakdown,
    weeklyProgress,
    milestones,
    skillGaps,
    roadmapWeeks:      roadmapWeeks.slice(0, totalWeeks),
    nextActions,
    confidenceHistory,
    stats: {
      hoursThisWeek:        0,  // populated by real checkin data
      hoursTarget:          opts.availableHoursPerWeek,
      milestonesCompleted,
      milestonesTotal,
      streakDays:           0,  // populated by real checkin data
      daysUntilReady,
    },
  }
}
