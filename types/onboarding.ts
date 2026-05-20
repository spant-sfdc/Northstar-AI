export type ExperienceLevel = "junior" | "mid" | "senior" | "staff" | "principal"
export type CompanySize    = "startup" | "growth" | "enterprise" | "any"
export type WorkType       = "remote" | "hybrid" | "onsite" | "flexible"

export interface OnboardingData {
  // Step 1
  currentRole: string
  // Step 2
  experienceLevel: ExperienceLevel
  yearsOfExperience: number
  // Step 3
  currentSkills: string[]
  // Step 4 — optional; user may skip resume upload
  resumeStoragePath?: string
  resumeFileName?: string
  // Step 5
  targetRole: string
  targetCompanySize: CompanySize
  // Step 6
  targetTimelineMonths: number
  // Step 7
  availableHoursPerWeek: number
  // Step 8
  careerStruggles: string[]
  // Step 9
  preferredWorkType: WorkType
  // Step 10
  confidenceScore: number
}

export type PartialOnboardingData = Partial<OnboardingData>
