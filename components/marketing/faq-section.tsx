"use client"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { FadeIn } from "./fade-in"

const FAQS = [
  {
    q: "How is SkillSynq different from online learning platforms?",
    a: "Online platforms give you courses. SkillSynq gives you a structured system — it benchmarks your current skills against real market requirements, identifies exactly which gaps to close, and generates a sequenced learning path specific to your target role. You're not picking from a catalog; you're following a plan built around your actual gaps.",
  },
  {
    q: "How does the readiness score work?",
    a: "We analyze your background, experience, and stated skills against a benchmark model for your target role at your target company tier. The model is built from real hiring requirements, not job description averages. Your score reflects where you stand on the dimensions that actually determine hiring outcomes — and it updates every time you complete a milestone.",
  },
  {
    q: "Which tech domains does SkillSynq cover?",
    a: "SkillSynq is built for tech professionals across Salesforce (Admin, Developer, Architect), cloud platforms (AWS, Azure, GCP), AI/ML engineering, software development, data analytics, and DevOps. If your role involves technical skills and certifications, SkillSynq can benchmark and build a path for it.",
  },
  {
    q: "How specific are the learning paths?",
    a: "Very specific. Not 'improve your system design skills' but 'Complete the AWS Solutions Architect module on VPC networking — target 3 hours, complete by end of week 2.' Every milestone has a deliverable, an effort estimate, and a clear connection to a gap it closes.",
  },
  {
    q: "What if my goals change mid-path?",
    a: "No problem. If your target role, timeline, or available hours change, you can trigger a full re-analysis. Your new roadmap accounts for milestones you've already completed — it won't start you from scratch.",
  },
  {
    q: "Can I use SkillSynq for career transitions?",
    a: "Yes. SkillSynq handles cross-discipline transitions. Tell us your target role (e.g., Data Engineer at a Series B startup) and your current background, and we build the bridge — including the foundational gaps you need to close before the role-specific ones.",
  },
  {
    q: "What does the free plan include?",
    a: "The free plan includes your full readiness assessment, gap analysis, and a preview of the first two weeks of your learning path. Premium plans unlock your full roadmap, progress tracking, score updates, AI adjustments, and roadmap regeneration.",
  },
  {
    q: "Is my data private?",
    a: "Yes. Your profile and onboarding data are stored securely and never shared or sold. We use OpenAI's API for analysis — your data is subject to their data processing agreement, which prohibits training on API inputs.",
  },
]

export function FaqSection() {
  return (
    <section id="faq" className="bg-white py-28">
      <div className="max-w-3xl mx-auto px-6">
        {/* Header */}
        <FadeIn>
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-600 text-center mb-5">
            FAQ
          </p>
        </FadeIn>

        <FadeIn delay={0.06}>
          <h2 className="text-center text-[38px] md:text-[48px] font-bold tracking-[-0.025em] text-slate-900 leading-[1.1] mb-14">
            Common questions.
          </h2>
        </FadeIn>

        {/* Accordion */}
        <FadeIn delay={0.12}>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-slate-100 rounded-xl px-6 shadow-sm data-[state=open]:border-slate-200 data-[state=open]:shadow-md transition-all"
              >
                <AccordionTrigger className="text-[15px] font-semibold text-slate-800 hover:text-slate-900 hover:no-underline py-5 text-left">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-[14.5px] text-slate-500 leading-relaxed pb-5">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </FadeIn>

        {/* Bottom link */}
        <FadeIn delay={0.18} className="mt-12 text-center">
          <p className="text-[14px] text-slate-500">
            Still have questions?{" "}
            <a href="mailto:hello@skillsynq.co.in" className="text-blue-600 font-medium hover:underline">
              Email us
            </a>
          </p>
        </FadeIn>
      </div>
    </section>
  )
}
