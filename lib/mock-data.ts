// All dashboard mock data — replace with real Supabase queries once AI analysis is wired

export interface MockUser {
  name: string
  email: string
  currentRole: string
  targetRole: string
  targetCompanySize: string
  timelineMonths: number
  weekNumber: number
  startDate: string
}

export interface WeeklyProgressPoint {
  week: string
  hours: number
  completed: number
  target: number
}

export interface Milestone {
  id: string
  title: string
  weekNumber: number
  status: "complete" | "in_progress" | "not_started"
  category: string
  estimatedMinutes: number
}

export interface SkillGap {
  skill: string
  current: number   // 0–100
  target: number    // 0–100
  category: string
  priority: "high" | "medium" | "low"
}

export interface RoadmapWeek {
  week: number
  theme: string
  milestoneCount: number
  status: "complete" | "current" | "upcoming"
  focusArea: string
}

export interface NextAction {
  id: string
  title: string
  priority: "high" | "medium" | "low"
  estimatedMinutes: number
  category: string
}

export interface ConfidencePoint {
  label: string
  score: number  // 1–10
}

export interface DashboardData {
  user: MockUser
  readinessScore: number
  readinessBreakdown: { label: string; score: number; weight: number }[]
  weeklyProgress: WeeklyProgressPoint[]
  milestones: Milestone[]
  skillGaps: SkillGap[]
  roadmapWeeks: RoadmapWeek[]
  nextActions: NextAction[]
  confidenceHistory: ConfidencePoint[]
  stats: {
    hoursThisWeek: number
    hoursTarget: number
    milestonesCompleted: number
    milestonesTotal: number
    streakDays: number
    daysUntilReady: number
  }
}

export const MOCK_DASHBOARD: DashboardData = {
  user: {
    name: "Shashank",
    email: "shashank@example.com",
    currentRole: "Software Engineer II",
    targetRole: "Senior Software Engineer",
    targetCompanySize: "growth",
    timelineMonths: 4,
    weekNumber: 3,
    startDate: "2026-04-28",
  },

  readinessScore: 68,

  readinessBreakdown: [
    { label: "Technical depth",     score: 72, weight: 35 },
    { label: "System design",       score: 48, weight: 25 },
    { label: "Behavioral stories",  score: 78, weight: 20 },
    { label: "Job search posture",  score: 55, weight: 20 },
  ],

  weeklyProgress: [
    { week: "W1", hours: 5,  completed: 2, target: 10 },
    { week: "W2", hours: 8,  completed: 3, target: 10 },
    { week: "W3", hours: 6,  completed: 2, target: 10 },
    { week: "W4", hours: 10, completed: 4, target: 10 },
    { week: "W5", hours: 7,  completed: 3, target: 10 },
    { week: "W6", hours: 12, completed: 5, target: 10 },
    { week: "W7", hours: 9,  completed: 4, target: 10 },
    { week: "W8", hours: 11, completed: 5, target: 10 },
  ],

  milestones: [
    { id: "1", title: "Revise system design fundamentals",       weekNumber: 2, status: "complete",    category: "System Design",  estimatedMinutes: 120 },
    { id: "2", title: "Solve 5 LeetCode medium problems",       weekNumber: 2, status: "complete",    category: "Algorithms",     estimatedMinutes: 150 },
    { id: "3", title: "Draft STAR story for latency reduction", weekNumber: 3, status: "in_progress", category: "Behavioral",     estimatedMinutes: 45  },
    { id: "4", title: "Research 10 target companies",           weekNumber: 3, status: "in_progress", category: "Job Search",     estimatedMinutes: 60  },
    { id: "5", title: "Mock interview with a peer",             weekNumber: 3, status: "not_started", category: "Interview Prep", estimatedMinutes: 60  },
    { id: "6", title: "Update LinkedIn headline & summary",     weekNumber: 4, status: "not_started", category: "Personal Brand", estimatedMinutes: 30  },
    { id: "7", title: "Read DDIA Chapter 5: Replication",       weekNumber: 4, status: "not_started", category: "System Design",  estimatedMinutes: 90  },
  ],

  skillGaps: [
    { skill: "System Design",          current: 45, target: 85, category: "Technical",  priority: "high"   },
    { skill: "Algorithms & DS",        current: 62, target: 90, category: "Technical",  priority: "high"   },
    { skill: "Technical Communication",current: 55, target: 80, category: "Soft Skills",priority: "medium" },
    { skill: "Leadership Stories",     current: 70, target: 85, category: "Behavioral", priority: "medium" },
    { skill: "Salary Negotiation",     current: 30, target: 75, category: "Career",     priority: "medium" },
    { skill: "Networking",             current: 40, target: 70, category: "Career",     priority: "low"    },
  ],

  roadmapWeeks: [
    { week: 1,  theme: "Foundation",        milestoneCount: 4, status: "complete", focusArea: "Core concepts"       },
    { week: 2,  theme: "Core Concepts",     milestoneCount: 5, status: "complete", focusArea: "Algorithms"          },
    { week: 3,  theme: "Deep Work",         milestoneCount: 6, status: "current",  focusArea: "System design"       },
    { week: 4,  theme: "Practice",          milestoneCount: 5, status: "upcoming", focusArea: "Mock problems"       },
    { week: 5,  theme: "Behavioral",        milestoneCount: 4, status: "upcoming", focusArea: "STAR stories"        },
    { week: 6,  theme: "System Design",     milestoneCount: 6, status: "upcoming", focusArea: "Design interviews"   },
    { week: 7,  theme: "Mock Interviews",   milestoneCount: 5, status: "upcoming", focusArea: "Full loops"          },
    { week: 8,  theme: "Applications",      milestoneCount: 4, status: "upcoming", focusArea: "Outreach"            },
    { week: 9,  theme: "Follow-ups",        milestoneCount: 3, status: "upcoming", focusArea: "Pipeline management" },
    { week: 10, theme: "Final Prep",        milestoneCount: 4, status: "upcoming", focusArea: "Polish"              },
    { week: 11, theme: "Interview Week",    milestoneCount: 3, status: "upcoming", focusArea: "Execution"           },
    { week: 12, theme: "Offer & Negotiate", milestoneCount: 2, status: "upcoming", focusArea: "Negotiation"         },
  ],

  nextActions: [
    { id: "1", title: "Complete STAR story — 'Reduced API latency by 40%'",          priority: "high",   estimatedMinutes: 45, category: "Behavioral"    },
    { id: "2", title: "Read DDIA Ch. 5: Replication & consistency models",            priority: "high",   estimatedMinutes: 90, category: "System Design" },
    { id: "3", title: "Solve LeetCode #146: LRU Cache",                               priority: "medium", estimatedMinutes: 30, category: "Algorithms"    },
    { id: "4", title: "Connect with 3 senior engineers at target companies",          priority: "medium", estimatedMinutes: 20, category: "Networking"    },
    { id: "5", title: "Update resume — add Q1 impact metrics to current role",        priority: "low",    estimatedMinutes: 60, category: "Job Search"    },
  ],

  confidenceHistory: [
    { label: "Start", score: 4 },
    { label: "W1",    score: 4 },
    { label: "W2",    score: 5 },
    { label: "W3",    score: 5 },
    { label: "W4",    score: 6 },
    { label: "W5",    score: 6 },
    { label: "W6",    score: 7 },
    { label: "Now",   score: 7 },
  ],

  stats: {
    hoursThisWeek: 7,
    hoursTarget: 10,
    milestonesCompleted: 7,
    milestonesTotal: 39,
    streakDays: 5,
    daysUntilReady: 63,
  },
}
