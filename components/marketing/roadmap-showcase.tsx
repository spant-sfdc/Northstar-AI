"use client"

import { FadeIn } from "./fade-in"
import { cn } from "@/lib/utils"

const WEEKS = [
  {
    week: "Week 1–2",
    phase: "Foundation",
    color: "border-blue-300 bg-blue-50",
    dot: "bg-blue-500",
    milestones: [
      { label: "Rewrite LinkedIn headline for Staff Eng positioning", done: true },
      { label: "Complete system design self-assessment (DDIA chapters 1-4)", done: true },
    ],
  },
  {
    week: "Week 3–4",
    phase: "Skill build",
    color: "border-violet-300 bg-violet-50",
    dot: "bg-violet-500",
    milestones: [
      { label: "Design and document a distributed rate-limiter from scratch", done: true },
      { label: "Complete 2 system design mock interviews on Pramp", done: false },
    ],
  },
  {
    week: "Week 5–6",
    phase: "Leadership signal",
    color: "border-slate-200 bg-slate-50",
    dot: "bg-slate-400",
    milestones: [
      { label: "Draft internal RFC: caching strategy for user-service", done: false },
      { label: "Mentor 1 junior engineer — document the session", done: false },
    ],
  },
  {
    week: "Week 7–8",
    phase: "Market activation",
    color: "border-slate-200 bg-slate-50/50",
    dot: "bg-slate-300",
    milestones: [
      { label: "Apply to 5 target companies with tailored positioning", done: false },
      { label: "Reach readiness score of 85+", done: false },
    ],
  },
]

export function RoadmapShowcase() {
  return (
    <section className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left: UI mock */}
          <FadeIn direction="right">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/60 overflow-hidden">
              {/* Header */}
              <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between bg-slate-50/50">
                <div>
                  <h3 className="text-[14px] font-semibold text-slate-900">Your 12-Week Roadmap</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Senior Engineer → Staff Engineer</p>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-400">Week</span>
                  <span className="font-bold text-slate-900">4</span>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-400">12</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30">
                <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-medium">
                  <span>Overall progress</span>
                  <span>33%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "33%" }} />
                </div>
              </div>

              {/* Timeline */}
              <div className="p-6 space-y-5">
                {WEEKS.map((week, i) => (
                  <div key={week.week} className="flex gap-4">
                    {/* Connector */}
                    <div className="flex flex-col items-center gap-0">
                      <div className={cn("w-3 h-3 rounded-full mt-1 flex-shrink-0", week.dot)} />
                      {i < WEEKS.length - 1 && (
                        <div className="w-px flex-1 bg-slate-100 mt-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className={cn("flex-1 rounded-xl border p-4 mb-1", week.color)}>
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="text-[12px] font-semibold text-slate-700">{week.week}</div>
                        <div className="text-[10px] font-medium text-slate-500 bg-white/60 rounded-full px-2 py-0.5 border border-white/40">
                          {week.phase}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {week.milestones.map((m, j) => (
                          <div key={j} className="flex items-start gap-2">
                            <div className={cn(
                              "mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                              m.done ? "bg-blue-500 border-blue-500" : "border-slate-300 bg-white"
                            )}>
                              {m.done && (
                                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4l2.3 2.3 7.3-7.3a1 1 0 0 1 1.4 0z" />
                                </svg>
                              )}
                            </div>
                            <span className={cn(
                              "text-[12px] leading-relaxed",
                              m.done ? "text-slate-400 line-through" : "text-slate-700"
                            )}>
                              {m.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Right: copy */}
          <div>
            <FadeIn>
              <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 mb-5">
                Learning roadmap
              </p>
            </FadeIn>

            <FadeIn delay={0.06}>
              <h2 className="text-[38px] md:text-[48px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1] mb-6">
                A plan you can actually follow.
              </h2>
            </FadeIn>

            <FadeIn delay={0.12}>
              <p className="text-[17px] text-slate-500 leading-relaxed mb-8">
                Not a course. Not a list of resources. A sequenced, week-by-week execution plan
                built specifically around your gaps, your schedule, and your target timeline.
              </p>
            </FadeIn>

            <FadeIn delay={0.18}>
              <div className="space-y-5">
                {[
                  {
                    label: "Built around your calendar",
                    body: "Tell us you have 8 hours a week and a 10-week timeline. The plan respects that — every milestone is scoped to fit.",
                  },
                  {
                    label: "Sequenced, not shuffled",
                    body: "Milestones build on each other. You won't be asked to lead a design review before you've done the underlying systems work.",
                  },
                  {
                    label: "Updated as you progress",
                    body: "Mark a milestone complete and your roadmap adapts. Fall behind? It recalibrates without shaming you.",
                  },
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
        </div>
      </div>
    </section>
  )
}
