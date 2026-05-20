"use client"

import { useState } from "react"
import { AnimatePresence } from "framer-motion"
import { Lock, Sparkles, Calendar, MessageSquare, TrendingUp } from "lucide-react"
import { UpgradeModal } from "@/components/billing/upgrade-modal"

const FEATURES = [
  {
    icon:  Sparkles,
    title: "AI Roadmap Refinement",
    desc:  "Automatically adjusts your plan based on weekly check-ins and progress signals.",
    color: "text-violet-500 bg-violet-50",
  },
  {
    icon:  Calendar,
    title: "Interview Scheduler",
    desc:  "Syncs with your calendar and books mock interviews with vetted peers automatically.",
    color: "text-indigo-500 bg-indigo-50",
  },
  {
    icon:  MessageSquare,
    title: "Offer Negotiation Coach",
    desc:  "AI-guided scripts and real comp data to help you negotiate confidently.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon:  TrendingUp,
    title: "Market Intelligence",
    desc:  "Live salary ranges, hiring trends, and company-specific interview patterns.",
    color: "text-amber-600 bg-amber-50",
  },
]

interface Props {
  userEmail?: string
  userName?:  string
}

export function PremiumPreview({ userEmail = "", userName = "" }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 pt-6 pb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">Unlock SkillSynq Pro</h3>
            <p className="text-[12px] text-slate-400 mt-0.5">Features that accelerate your job search</p>
          </div>
          <div className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-500 to-violet-600 text-white text-[11px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
            <Sparkles className="w-3 h-3" />
            Pro
          </div>
        </div>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.title} className="relative rounded-xl border border-slate-100 p-4 overflow-hidden">
                  <div className="filter blur-[1.5px] select-none pointer-events-none">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${feature.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className="text-[12.5px] font-semibold text-slate-800 leading-snug mb-1">{feature.title}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{feature.desc}</p>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-xl">
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Pro only</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="w-full sm:w-auto flex-1 sm:flex-none h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[13.5px] font-semibold transition-colors"
            >
              View plans
            </button>
            <p className="text-[12px] text-slate-400">
              From ₹399/month · Cancel anytime
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showUpgrade && (
          <UpgradeModal
            userEmail={userEmail}
            userName={userName}
            onClose={() => setShowUpgrade(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
