import { z } from "zod"

export const stepSchemas = {
  1: z.object({
    currentRole: z.string().min(2, "Enter your current job title"),
  }),

  2: z.object({
    experienceLevel: z.enum(["junior", "mid", "senior", "staff", "principal"], {
      error: "Select your experience level",
    }),
    yearsOfExperience: z.number().min(0).max(40),
  }),

  3: z.object({
    currentSkills: z.array(z.string()).min(1, "Select at least one skill"),
  }),

  4: z.object({
    resumeStoragePath: z.string().min(1, "Please upload your resume"),
    resumeFileName: z.string().min(1),
  }),

  5: z.object({
    targetRole: z.string().min(2, "Enter your target role"),
    targetCompanySize: z.enum(["startup", "growth", "enterprise", "any"], {
      error: "Select a company size preference",
    }),
  }),

  6: z.object({
    targetTimelineMonths: z.number().min(4).max(24),
  }),

  7: z.object({
    availableHoursPerWeek: z.number().min(1).max(40),
  }),

  8: z.object({
    careerStruggles: z.array(z.string()).min(1, "Select at least one area"),
  }),

  9: z.object({
    preferredWorkType: z.enum(["remote", "hybrid", "onsite", "flexible"], {
      error: "Select a work type",
    }),
  }),

  10: z.object({
    confidenceScore: z.number().min(1).max(10),
  }),
} as const

export type StepNumber = keyof typeof stepSchemas

export const fullOnboardingSchema = z.object({
  currentRole:              stepSchemas[1].shape.currentRole,
  experienceLevel:          stepSchemas[2].shape.experienceLevel,
  yearsOfExperience:        stepSchemas[2].shape.yearsOfExperience,
  currentSkills:            stepSchemas[3].shape.currentSkills,
  resumeStoragePath:        z.string().optional(),
  resumeFileName:           z.string().optional(),
  targetRole:               stepSchemas[5].shape.targetRole,
  targetCompanySize:        stepSchemas[5].shape.targetCompanySize,
  targetTimelineMonths:     stepSchemas[6].shape.targetTimelineMonths,
  availableHoursPerWeek:    stepSchemas[7].shape.availableHoursPerWeek,
  careerStruggles:          stepSchemas[8].shape.careerStruggles,
  preferredWorkType:        stepSchemas[9].shape.preferredWorkType,
  confidenceScore:          stepSchemas[10].shape.confidenceScore,
})

export type FullOnboardingData = z.infer<typeof fullOnboardingSchema>
