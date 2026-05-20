"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { stepSchemas } from "@/lib/validations/onboarding"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"

type FormData = { currentRole: string }

const SUGGESTIONS = [
  "Software Engineer", "Senior Software Engineer", "Engineering Manager",
  "Product Manager", "Staff Engineer", "Frontend Developer", "Backend Developer",
  "Full Stack Developer", "DevOps Engineer", "Data Engineer",
]

export function StepCurrentRole() {
  const { data, nextStep, updateData } = useOnboardingStore()

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(stepSchemas[1]),
      defaultValues: { currentRole: data.currentRole ?? "" },
    })

  const currentRole = watch("currentRole")

  function onSubmit(values: FormData) {
    updateData(values)
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <StepHeader
        title="What's your current role?"
        subtitle="Tell us where you're starting from. Be specific — it helps us calibrate your roadmap."
      />

      <div className="space-y-3 flex-1">
        <Label htmlFor="currentRole" className="text-[13px] font-medium text-slate-600 sr-only">
          Current role
        </Label>
        <Input
          id="currentRole"
          placeholder="e.g. Senior Software Engineer"
          autoFocus
          autoComplete="organization-title"
          {...register("currentRole")}
          className={cn(
            "h-12 text-[15px] border-slate-200 focus-visible:ring-indigo-200 focus-visible:border-indigo-300",
            errors.currentRole && "border-red-300 focus-visible:ring-red-100"
          )}
        />
        {errors.currentRole && (
          <p className="text-[12.5px] text-red-500">{errors.currentRole.message}</p>
        )}

        {/* Quick suggestions */}
        {!currentRole && (
          <div className="pt-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Common roles
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue("currentRole", s, { shouldValidate: true })}
                  className="text-[12.5px] font-medium text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <StepActions onNext={handleSubmit(onSubmit)} step={1} />
    </form>
  )
}
