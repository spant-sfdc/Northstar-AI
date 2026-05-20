"use client"

import { FadeIn } from "./fade-in"
import { cn } from "@/lib/utils"

const GAPS = [
  { skill: "System Design (Staff level)", yours: 52, required: 85, critical: true },
  { skill: "Technical Leadership", yours: 61, required: 80, critical: true },
  { skill: "Data Structures & Algorithms", yours: 78, required: 85, critical: false },
  { skill: "Cross-functional Communication", yours: 84, required: 75, critical: false },
  { skill: "Distributed Systems", yours: 48, required: 80, critical: true },
]

function GapRow({
  skill,
  yours,
  required,
  critical,
}: {
  skill: string
  yours: number
  required: number
  critical: boolean
}) {
  const gap = required - yours
  const met = yours >= required

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-slate-700">{skill}</span>
          {critical && !met && (
            <span className="text-[10px] font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2 py-0.5">
              Gap
            </span>
          )}
          {met && (
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2 py-0.5">
              Met
            </span>
          )}
        </div>
        <div className="text-[12px] text-slate-400">
          <span className={cn("font-semibold", met ? "text-emerald-600" : "text-slate-700")}>{yours}%</span>
          <span className="mx-1">/</span>
          <span>{required}%</span>
        </div>
      </div>
      <div className="relative h-2 bg-slate-100 rounded-full overflow-visible">
        {/* Required marker */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-300 rounded-full z-10"
          style={{ left: `${required}%` }}
        />
        {/* Yours bar */}
        <div
          className={cn(
            "h-full rounded-full transition-all",
            met ? "bg-emerald-500" : critical ? "bg-rose-400" : "bg-blue-400"
          )}
          style={{ width: `${yours}%` }}
        />
      </div>
    </div>
  )
}

export function ReadinessShowcase() {
  return (
    <section className="bg-slate-50 border-y border-slate-100 py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: copy */}
          <div>
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-5">
                Readiness analysis
              </p>
            </FadeIn>

            <FadeIn delay={0.06}>
              <h2 className="text-[38px] md:text-[48px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1] mb-6">
                Not a vibe check. A scored assessment.
              </h2>
            </FadeIn>

            <FadeIn delay={0.12}>
              <p className="text-[17px] text-slate-500 leading-relaxed mb-8">
                SkillSynq maps your current skill levels against what companies in your target tier actually require —
                based on real hiring signals, not job description boilerplate.
              </p>
            </FadeIn>

            <FadeIn delay={0.18}>
              <div className="space-y-5">
                {[
                  { label: "Evidence-based scoring", body: "Your score reflects real market benchmarks for your target role at your target company tier." },
                  { label: "Prioritized gap list", body: "Critical gaps are ranked by hiring impact — so you work on what matters, not what's easiest." },
                  { label: "Rescored on every update", body: "Complete a milestone and your readiness score updates. Progress is never invisible." },
                ].map((item) => (
                  <div key={item.label} className="flex gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-slate-800 mb-0.5">{item.label}</p>
                      <p className="text-[13.5px] text-slate-500 leading-relaxed">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>

          {/* Right: UI mock */}
          <FadeIn delay={0.1} direction="left">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/60 overflow-hidden">
              {/* Card header */}
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Readiness Analysis</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Senior Engineer → Staff Engineer · Series B+</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-slate-900">72<span className="text-slate-300 text-base font-medium">/100</span></div>
                  <div className="text-[10px] font-medium text-amber-600 bg-amber-50 rounded-full px-2 py-0.5 mt-1">Approaching ready</div>
                </div>
              </div>

              {/* Gap breakdown */}
              <div className="p-6 space-y-5">
                <div className="flex items-center justify-between text-[11px] font-medium text-slate-400 pb-1">
                  <span>SKILL</span>
                  <span>YOURS / REQUIRED</span>
                </div>
                {GAPS.map((gap) => (
                  <GapRow key={gap.skill} {...gap} />
                ))}
              </div>

              {/* Footer */}
              <div className="border-t border-slate-100 px-6 py-4 bg-slate-50/50">
                <p className="text-[12px] text-slate-400">
                  <span className="font-medium text-slate-600">3 critical gaps</span> identified · Projected readiness at 12 weeks:{" "}
                  <span className="font-semibold text-blue-600">91/100</span>
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
