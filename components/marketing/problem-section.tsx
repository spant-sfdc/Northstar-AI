"use client"

import { FadeIn, FadeInStagger, FadeInItem } from "./fade-in"

const PROBLEMS = [
  {
    number: "01",
    title: "You don't know which skills actually matter",
    body: "Job descriptions list everything. Courses teach everything. Without benchmarking your skills against real market requirements for your exact target role, you're learning by instinct — not intelligence.",
  },
  {
    number: "02",
    title: "Generic courses don't create career outcomes",
    body: "Completing a module isn't the same as building a competency. Without sequencing, context, and real-world application — hours spent learning don't translate to career movement.",
  },
  {
    number: "03",
    title: "Progress is invisible until it's too late",
    body: "You can invest months in upskilling, feel like you're moving forward, and still face the same gaps at your next role or review. Without measurable benchmarks, effort and outcome stay disconnected.",
  },
]

export function ProblemSection() {
  return (
    <section className="bg-slate-50 border-y border-slate-100 py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Label */}
        <FadeIn>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 text-center mb-5">
            The learning problem
          </p>
        </FadeIn>

        {/* Headline */}
        <FadeIn delay={0.06}>
          <h2 className="text-center text-[38px] md:text-[52px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1] max-w-3xl mx-auto">
            The gap between ambition and outcome is execution.
          </h2>
        </FadeIn>

        <FadeIn delay={0.12}>
          <p className="mt-5 text-center text-[18px] text-slate-500 max-w-xl mx-auto leading-relaxed">
            Most professionals don&apos;t stall because they lack potential. They stall because they lack a map.
          </p>
        </FadeIn>

        {/* Problem cards */}
        <FadeInStagger className="mt-16 grid md:grid-cols-3 gap-5" staggerDelay={0.1}>
          {PROBLEMS.map((problem) => (
            <FadeInItem key={problem.number}>
              <div className="bg-white rounded-2xl border border-slate-100 p-8 h-full shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300">
                <div className="text-[11px] font-bold text-blue-500 tracking-widest mb-5">
                  {problem.number}
                </div>
                <h3 className="text-[17px] font-semibold text-slate-900 mb-3 leading-snug">
                  {problem.title}
                </h3>
                <p className="text-[14.5px] text-slate-500 leading-relaxed">
                  {problem.body}
                </p>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>

        {/* Callout */}
        <FadeIn delay={0.2} className="mt-14">
          <div className="max-w-2xl mx-auto text-center border-t border-slate-200 pt-10">
            <p className="text-[15px] text-slate-500 leading-relaxed">
              SkillSynq replaces scattered learning with a structured, AI-guided system that benchmarks
              where you are, maps the gap to where you need to be, and builds a sequenced path that gets you there.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
