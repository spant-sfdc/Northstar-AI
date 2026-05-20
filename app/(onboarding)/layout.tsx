import Link from "next/link"
import { Toaster } from "@/components/ui/sonner"

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal logo — no nav */}
      <header className="flex-shrink-0 px-6 pt-5 pb-0">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
            <svg width="11" height="11" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="2" fill="white" />
              <path
                d="M6.5 1.5V4M6.5 9V11.5M1.5 6.5H4M9 6.5H11.5M3.2 3.2L4.9 4.9M8.1 8.1L9.8 9.8M9.8 3.2L8.1 4.9M4.9 8.1L3.2 9.8"
                stroke="white" strokeWidth="1.2" strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="text-[14px] font-semibold text-slate-700 tracking-tight">SkillSynq</span>
        </Link>
      </header>

      <main className="flex-1 flex flex-col">{children}</main>
      <Toaster position="bottom-center" />
    </div>
  )
}
