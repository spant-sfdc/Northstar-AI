"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Lock, X } from "lucide-react"
import { UpgradeModal } from "@/components/billing/upgrade-modal"

interface Props {
  feature:     string
  description: string
  onClose:     () => void
  userEmail?:  string
  userName?:   string
}

export function PremiumGate({ feature, description, onClose, userEmail = "", userName = "" }: Props) {
  const [showUpgrade, setShowUpgrade] = useState(false)

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />

        <motion.div
          className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
        >
          {/* Gradient header */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-600 px-6 pt-8 pb-10 relative">
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                <Lock className="w-4 h-4 text-white" />
              </div>
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">Premium</span>
            </div>
            <h2 className="text-[20px] font-bold text-white leading-tight mb-1">{feature}</h2>
            <p className="text-[13px] text-white/70 leading-relaxed">{description}</p>
          </div>

          {/* CTA */}
          <div className="-mt-4 bg-white rounded-t-3xl px-6 pt-6 pb-8">
            <button
              type="button"
              onClick={() => setShowUpgrade(true)}
              className="w-full h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[14px] font-semibold transition-colors"
            >
              View plans
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full mt-3 text-[12px] text-slate-400 hover:text-slate-600 transition-colors py-1"
            >
              Continue on free plan
            </button>
          </div>
        </motion.div>
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
