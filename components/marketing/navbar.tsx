"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing",      href: "#pricing"      },
  { label: "FAQ",          href: "#faq"           },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-white/90 backdrop-blur-lg border-b border-slate-100/80 shadow-sm"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-sm">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="2" fill="white" />
              <path
                d="M6.5 1.5V4M6.5 9V11.5M1.5 6.5H4M9 6.5H11.5M3.2 3.2L4.9 4.9M8.1 8.1L9.8 9.8M9.8 3.2L8.1 4.9M4.9 8.1L3.2 9.8"
                stroke="white" strokeWidth="1.2" strokeLinecap="round"
              />
            </svg>
          </div>
          <span className={cn(
            "font-semibold tracking-tight text-[15px] transition-colors duration-300",
            scrolled ? "text-slate-900" : "text-white"
          )}>
            SkillSynq
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "text-[13.5px] font-medium transition-colors duration-300",
                scrolled
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-slate-300 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2">
          <Link href="/login">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-[13.5px] font-medium transition-colors duration-300",
                scrolled
                  ? "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              )}
            >
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              size="sm"
              className="text-[13.5px] bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white border-0 shadow-sm shadow-blue-900/30 h-8 px-4 transition-all"
            >
              Get started free
            </Button>
          </Link>
        </div>
      </div>
    </motion.header>
  )
}
