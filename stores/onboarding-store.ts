"use client"

import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type { PartialOnboardingData } from "@/types/onboarding"

const TOTAL_STEPS = 10

interface OnboardingStore {
  step: number
  direction: number
  data: PartialOnboardingData
  isSaving: boolean
  isComplete: boolean

  nextStep: () => void
  prevStep: () => void
  goToStep: (n: number) => void
  updateData: (updates: PartialOnboardingData) => void
  setIsSaving: (v: boolean) => void
  markComplete: () => void
  reset: () => void
}

const initialData: PartialOnboardingData = {}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      step: 1,
      direction: 1,
      data: initialData,
      isSaving: false,
      isComplete: false,

      nextStep: () =>
        set((s) => ({
          step: Math.min(s.step + 1, TOTAL_STEPS),
          direction: 1,
        })),

      prevStep: () =>
        set((s) => ({
          step: Math.max(s.step - 1, 1),
          direction: -1,
        })),

      goToStep: (n) =>
        set((s) => ({
          step: n,
          direction: n > s.step ? 1 : -1,
        })),

      updateData: (updates) =>
        set((s) => ({ data: { ...s.data, ...updates } })),

      setIsSaving: (v) => set({ isSaving: v }),

      markComplete: () => set({ isComplete: true }),

      reset: () =>
        set({ step: 1, direction: 1, data: initialData, isComplete: false }),
    }),
    {
      name: "northstar-onboarding",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ step: s.step, data: s.data }),
    }
  )
)

export const TOTAL_ONBOARDING_STEPS = TOTAL_STEPS
