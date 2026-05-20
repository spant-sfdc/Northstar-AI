"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DashboardMock } from "./dashboard-mock"

export function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-20 overflow-hidden bg-[#030711]">
      {/* Ambient glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(56,189,248,0.14),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(99,102,241,0.08),transparent)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_20%_70%,rgba(34,211,238,0.06),transparent)] pointer-events-none" />

      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="inline-flex items-center gap-2 text-[12px] font-medium text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 rounded-full px-4 py-1.5">
            <Sparkles className="w-3 h-3" />
            AI-native career intelligence
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="text-center text-[52px] md:text-[80px] font-bold tracking-[-0.04em] text-white leading-[1.02] max-w-4xl mx-auto"
        >
          Grow with{" "}
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
            precision.
          </span>
          <br />
          Not guesswork.
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mt-8 text-center text-[18px] md:text-[20px] text-slate-400 leading-relaxed max-w-2xl mx-auto"
        >
          SkillSynq benchmarks your expertise against where the market is heading, builds a
          personalized AI-guided learning path, and adapts as you grow — so every hour of
          learning moves your career forward.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/signup">
            <Button
              size="lg"
              className="h-12 px-7 text-[15px] font-medium bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white border-0 shadow-lg shadow-blue-900/40 transition-all hover:shadow-blue-900/60"
            >
              Start my learning path
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button
              variant="ghost"
              size="lg"
              className="h-12 px-7 text-[15px] font-medium text-slate-400 hover:text-white hover:bg-white/10"
            >
              See how it works
            </Button>
          </Link>
        </motion.div>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.36 }}
          className="mt-7 flex items-center justify-center gap-3"
        >
          <div className="flex -space-x-2">
            {["SC", "MK", "AR", "JL", "TP"].map((initials) => (
              <div
                key={initials}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 border-2 border-[#030711] flex items-center justify-center text-[8px] font-bold text-white"
              >
                {initials}
              </div>
            ))}
          </div>
          <p className="text-[13px] text-slate-500">
            Trusted by <span className="text-slate-300 font-medium">500+ tech professionals</span>
          </p>
        </motion.div>

        {/* Dashboard mock */}
        <motion.div
          initial={{ opacity: 0, y: 48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
          className="mt-20"
        >
          <DashboardMock />
        </motion.div>
      </div>
    </section>
  )
}
