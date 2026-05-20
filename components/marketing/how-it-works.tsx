"use client"

import { FadeIn, FadeInStagger, FadeInItem } from "./fade-in"

const STEPS = [
  {
    step: "01",
    title: "Map your current expertise",
    body: "Share your background, current role, certifications, and where you want to grow. SkillSynq builds a detailed competency profile — not a questionnaire, but a genuine skill map.",
    detail: "Role · Skills · Experience · Certifications · Goals · Timeline · Available hours",
  },
  {
    step: "02",
    title: "Get your AI-powered learning path",
    body: "Our AI benchmarks your profile against real market requirements for your target role and generates a personalized, sequenced learning path — built around your actual gaps, not generic curricula.",
    detail: "Skill gaps · Priority ranking · Resources · Milestone plan · Progress tracking",
  },
  {
    step: "03",
    title: "Execute, grow, and advance",
    body: "Follow your week-by-week plan. As you complete milestones, your readiness score updates — giving you a real signal of progress, not just activity. Your path adapts as you grow.",
    detail: "Weekly milestones · Score updates · AI adjustments · Career readiness · Outcomes",
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Label */}
        <FadeIn>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 text-center mb-5">
            How it works
          </p>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.06}>
          <h2 className="text-center text-[38px] md:text-[52px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1] max-w-3xl mx-auto">
            From profile to mastery in three steps.
          </h2>
        </FadeIn>

        <FadeIn delay={0.12}>
          <p className="mt-5 text-center text-[18px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            No generic advice. No vague recommendations. A structured system that shows you exactly what to build — and why.
          </p>
        </FadeIn>

        {/* Steps */}
        <FadeInStagger className="mt-20 relative" staggerDelay={0.12}>
          {/* Connector line */}
          <div className="hidden md:block absolute top-14 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent pointer-events-none" />

          <div className="grid md:grid-cols-3 gap-12 relative">
            {STEPS.map((step, index) => (
              <FadeInItem key={step.step}>
                <div className="flex flex-col gap-5">
                  {/* Step number */}
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center text-[13px] font-bold shadow-md shadow-blue-200 z-10 relative">
                        {index + 1}
                      </div>
                    </div>
                    <div className="h-px flex-1 bg-slate-100 md:hidden" />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className="text-[19px] font-semibold text-slate-900 mb-2.5 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-[15px] text-slate-500 leading-relaxed mb-4">
                      {step.body}
                    </p>
                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[11.5px] text-slate-400 font-medium leading-relaxed">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                </div>
              </FadeInItem>
            ))}
          </div>
        </FadeInStagger>

        {/* Stat callout */}
        <FadeIn delay={0.16} className="mt-20">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl px-10 py-8 max-w-3xl mx-auto text-center">
            <p className="text-[14px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Average time to first role milestone
            </p>
            <p className="text-[42px] font-bold text-slate-900 tracking-tight leading-none mb-2">8.4 weeks</p>
            <p className="text-[14px] text-slate-500">
              for professionals who follow their full AI-generated path and complete their core skill milestones
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
