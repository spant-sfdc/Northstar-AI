"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { StepHeader, StepActions } from "@/components/onboarding/step-wrapper"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

const SKILL_GROUPS = {
  Languages:      ["JavaScript", "TypeScript", "Python", "Go", "Rust", "Java", "C++", "Ruby", "Swift", "Kotlin"],
  Frontend:       ["React", "Next.js", "Vue", "Angular", "Svelte", "CSS", "Tailwind"],
  Backend:        ["Node.js", "FastAPI", "Django", "Rails", "Spring", "GraphQL", "REST APIs"],
  Infrastructure: ["AWS", "GCP", "Azure", "Kubernetes", "Docker", "Terraform", "CI/CD"],
  Data:           ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Kafka", "Spark", "dbt"],
  Leadership:     ["System Design", "Technical Leadership", "Code Review", "Mentoring", "RFC Writing"],
}

export function StepSkills() {
  const { data, updateData, nextStep, prevStep } = useOnboardingStore()
  const [selected, setSelected] = useState<Set<string>>(
    new Set(data.currentSkills ?? [])
  )
  const [search, setSearch] = useState("")

  function toggle(skill: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(skill)) next.delete(skill)
      else next.add(skill)
      return next
    })
  }

  function onNext() {
    if (selected.size === 0) {
      toast.error("Select at least one skill")
      return
    }
    updateData({ currentSkills: [...selected] })
    nextStep()
  }

  const query = search.toLowerCase()
  const allSkills = Object.values(SKILL_GROUPS).flat()
  const filtered  = query
    ? allSkills.filter((s) => s.toLowerCase().includes(query))
    : null

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="What skills do you have?"
        subtitle="Select everything that reflects your current capability — be honest, not aspirational."
      />

      {/* Selected chips */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
          <AnimatePresence>
            {[...selected].map((skill) => (
              <motion.button
                key={skill}
                type="button"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => toggle(skill)}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-full px-3 py-1 hover:bg-indigo-50 transition-colors"
              >
                {skill}
                <X className="w-3 h-3" />
              </motion.button>
            ))}
          </AnimatePresence>
          <span className="self-center text-[11px] text-indigo-400 font-medium ml-auto">
            {selected.size} selected
          </span>
        </div>
      )}

      {/* Search */}
      <Input
        placeholder="Search skills…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 h-9 text-[13.5px] border-slate-200"
      />

      {/* Skill groups */}
      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {filtered ? (
          <div className="flex flex-wrap gap-2">
            {filtered.length > 0 ? filtered.map((skill) => (
              <SkillChip key={skill} skill={skill} selected={selected.has(skill)} onToggle={() => toggle(skill)} />
            )) : (
              <p className="text-[13px] text-slate-400">No skills matched "{search}"</p>
            )}
          </div>
        ) : (
          Object.entries(SKILL_GROUPS).map(([group, skills]) => (
            <div key={group}>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{group}</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <SkillChip
                    key={skill}
                    skill={skill}
                    selected={selected.has(skill)}
                    onToggle={() => toggle(skill)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <StepActions onNext={onNext} onBack={prevStep} step={3} />
    </div>
  )
}

function SkillChip({ skill, selected, onToggle }: { skill: string; selected: boolean; onToggle: () => void }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className={cn(
        "text-[12.5px] font-medium rounded-full px-3.5 py-1.5 border transition-all",
        selected
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
      )}
    >
      {skill}
    </motion.button>
  )
}
