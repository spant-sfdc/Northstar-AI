import Link from "next/link"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Minimal header */}
      <header className="px-6 py-5">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center shadow-sm group-hover:bg-indigo-700 transition-colors">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="2" fill="white" />
              <path
                d="M6.5 1.5V4M6.5 9V11.5M1.5 6.5H4M9 6.5H11.5M3.2 3.2L4.9 4.9M8.1 8.1L9.8 9.8M9.8 3.2L8.1 4.9M4.9 8.1L3.2 9.8"
                stroke="white" strokeWidth="1.2" strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-semibold text-slate-900 tracking-tight text-[15px]">SkillSynq</span>
        </Link>
      </header>

      {/* Centered form area */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        {children}
      </main>
    </div>
  )
}
