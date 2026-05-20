"use client"

import { FadeIn, FadeInStagger, FadeInItem } from "./fade-in"

const TESTIMONIALS = [
  {
    quote:
      "SkillSynq showed me exactly which skills were holding me back. I'd been learning the wrong things for months. Eight weeks after I started the path, I had a cloud architect offer.",
    name: "Sarah Chen",
    role: "Now Cloud Architect at Stripe",
    initials: "SC",
    gradient: "from-blue-400 to-cyan-500",
  },
  {
    quote:
      "The path is actually sequenced for MY gaps — not some generic curriculum. I wasn't doing random courses anymore. Every hour I spent had a direct connection to something a hiring manager would test me on.",
    name: "Marcus Kim",
    role: "Now Senior Engineer at Figma",
    initials: "MK",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    quote:
      "Progress felt real and measurable for the first time. Every milestone moved my readiness score. I stopped wondering if I was ready and started knowing — and that confidence came through in every interview.",
    name: "Priya Anand",
    role: "Now Engineering Manager at Linear",
    initials: "PA",
    gradient: "from-slate-500 to-slate-700",
  },
]

export function Testimonials() {
  return (
    <section className="bg-slate-50 border-y border-slate-100 py-28">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 text-center mb-5">
            From the community
          </p>
        </FadeIn>

        <FadeIn delay={0.06}>
          <h2 className="text-center text-[38px] md:text-[48px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1] max-w-2xl mx-auto mb-5">
            Engineers who shipped their next move.
          </h2>
        </FadeIn>

        <FadeIn delay={0.1}>
          <p className="text-center text-[17px] text-slate-500 max-w-lg mx-auto mb-16 leading-relaxed">
            Real outcomes from tech professionals who used SkillSynq to get specific about what they needed to build.
          </p>
        </FadeIn>

        {/* Cards */}
        <FadeInStagger className="grid md:grid-cols-3 gap-5" staggerDelay={0.1}>
          {TESTIMONIALS.map((t) => (
            <FadeInItem key={t.name}>
              <div className="bg-white rounded-2xl border border-slate-100 p-8 h-full shadow-sm flex flex-col hover:shadow-md hover:border-slate-200 transition-all duration-300">
                {/* Quote marks */}
                <div className="text-4xl text-blue-200 font-serif leading-none mb-4 select-none">&ldquo;</div>

                {/* Quote */}
                <p className="text-[15px] text-slate-700 leading-relaxed flex-1 mb-8">
                  {t.quote}
                </p>

                {/* Author */}
                <div className="flex items-center gap-3 pt-5 border-t border-slate-100">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0`}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-slate-900">{t.name}</p>
                    <p className="text-[12px] text-blue-600 font-medium">{t.role}</p>
                  </div>
                </div>
              </div>
            </FadeInItem>
          ))}
        </FadeInStagger>

        {/* Disclaimer */}
        <FadeIn delay={0.2} className="mt-10 text-center">
          <p className="text-[12px] text-slate-400">
            Results vary based on starting point, commitment, and market conditions.
            Average time-to-offer for users who complete their full roadmap: 8.4 weeks.
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
