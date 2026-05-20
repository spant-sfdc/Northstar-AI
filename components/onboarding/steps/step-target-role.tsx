"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { stepSchemas } from "@/lib/validations/onboarding"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { Input } from "@/components/ui/input"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { cn } from "@/lib/utils"
import type { CompanySize } from "@/types/onboarding"

type FormData = { targetRole: string; targetCompanySize: CompanySize }

const COMPANY_SIZES: { id: CompanySize; label: string; desc: string; range: string }[] = [
  { id: "startup",    label: "Startup",     desc: "Early-stage, fast-moving", range: "< 50 people" },
  { id: "growth",     label: "Growth",      desc: "Scaling product and team",  range: "50 – 500" },
  { id: "enterprise", label: "Enterprise",  desc: "Established, FAANG-tier",   range: "500+" },
  { id: "any",        label: "Open to any", desc: "Role matters more than size",range: "Any size" },
]

const SUGGESTIONS = [
  "Staff Engineer", "Engineering Manager", "Senior SWE", "Principal Engineer",
  "Director of Engineering", "VP of Engineering", "ML Engineer", "Platform Engineer",
]

export function StepTargetRole() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [companySize, setCompanySize] = useState<CompanySize | "">(data.targetCompanySize ?? "")

  const { register, handleSubmit, setValue, watch, formState: { errors } } =
    useForm<FormData>({
      resolver: zodResolver(stepSchemas[5]),
      defaultValues: {
        targetRole: data.targetRole ?? "",
        targetCompanySize: (data.targetCompanySize as CompanySize) ?? undefined,
      },
    })

  const targetRole = watch("targetRole")

  function onSubmit(values: FormData) {
    updateData(values)
    nextStep()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      <StepHeader
        title="Where do you want to go?"
        subtitle="Be specific. The clearer your target, the more accurate your readiness score."
      />

      <div className="flex-1 space-y-6">
        {/* Role input */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-slate-600">Target role</label>
          <Input
            placeholder="e.g. Staff Engineer"
            autoFocus
            {...register("targetRole")}
            className={cn(
              "h-12 text-[15px] border-slate-200 focus-visible:ring-indigo-200 focus-visible:border-indigo-300",
              errors.targetRole && "border-red-300"
            )}
          />
          {errors.targetRole && <p className="text-[12px] text-red-500">{errors.targetRole.message}</p>}

          {!targetRole && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue("targetRole", s, { shouldValidate: true })}
                  className="text-[12px] font-medium text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full px-3 py-1 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Company size */}
        <div className="space-y-2">
          <label className="text-[13px] font-semibold text-slate-600">Company size preference</label>
          <div className="grid grid-cols-2 gap-2">
            {COMPANY_SIZES.map((cs) => {
              const isActive = companySize === cs.id
              return (
                <motion.button
                  key={cs.id}
                  type="button"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setCompanySize(cs.id)
                    setValue("targetCompanySize", cs.id, { shouldValidate: true })
                  }}
                  className={cn(
                    "p-3 rounded-xl border-2 text-left transition-all",
                    isActive
                      ? "border-indigo-500 bg-indigo-50/60"
                      : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                  )}
                >
                  <div className={cn("text-[13px] font-semibold mb-0.5", isActive ? "text-indigo-700" : "text-slate-800")}>
                    {cs.label}
                  </div>
                  <div className="text-[11px] text-slate-400">{cs.range}</div>
                </motion.button>
              )
            })}
          </div>
          {errors.targetCompanySize && (
            <p className="text-[12px] text-red-500">{errors.targetCompanySize.message}</p>
          )}
        </div>
      </div>

      <StepActions onNext={handleSubmit(onSubmit)} onBack={prevStep} step={5} />
    </form>
  )
}
