import { Hero } from "@/components/marketing/hero"
import { ProblemSection } from "@/components/marketing/problem-section"
import { HowItWorks } from "@/components/marketing/how-it-works"
import { ReadinessShowcase } from "@/components/marketing/readiness-showcase"
import { RoadmapShowcase } from "@/components/marketing/roadmap-showcase"
import { Testimonials } from "@/components/marketing/testimonials"
import { CtaSection } from "@/components/marketing/cta-section"
import { FaqSection } from "@/components/marketing/faq-section"

export const metadata = {
  title: "SkillSynq — AI-Guided Growth for Tech Professionals",
  description:
    "Grow with precision, not guesswork. SkillSynq benchmarks your expertise, builds a personalized AI-guided learning path, and adapts as you grow — so every hour of learning moves your career forward.",
}

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <HowItWorks />
      <ReadinessShowcase />
      <RoadmapShowcase />
      <Testimonials />
      <CtaSection />
      <FaqSection />
    </>
  )
}
