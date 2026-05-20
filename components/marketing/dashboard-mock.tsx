import { cn } from "@/lib/utils"

const SKILLS = [
  { name: "System Design", level: 78, color: "bg-blue-500" },
  { name: "Technical Leadership", level: 61, color: "bg-cyan-500" },
  { name: "Cross-team Collaboration", level: 84, color: "bg-blue-400" },
  { name: "Distributed Systems", level: 52, color: "bg-cyan-400" },
]

const MILESTONES = [
  { label: "Update LinkedIn headline to Staff Eng positioning", done: true },
  { label: "Complete 2 system design mock interviews", done: true },
  { label: "Write internal RFC on caching architecture", done: false },
  { label: "Apply to 3 target companies", done: false },
]

function SkillBar({ name, level, color }: { name: string; level: number; color: string }) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-medium text-slate-600">{name}</span>
        <span className="text-[11px] font-semibold text-slate-500">{level}%</span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${level}%` }}
        />
      </div>
    </div>
  )
}

function ReadinessRing({ score }: { score: number }) {
  const radius = 36
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="flex flex-col items-center justify-center gap-1">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="absolute inset-0 -rotate-90" width="96" height="96">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="7" />
          <circle
            cx="48" cy="48" r={radius} fill="none"
            stroke="#2563EB" strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="text-center z-10">
          <div className="text-2xl font-bold text-slate-900">{score}</div>
          <div className="text-[9px] font-medium text-slate-400 -mt-0.5">/100</div>
        </div>
      </div>
      <p className="text-[11px] font-semibold text-blue-600">Market Ready</p>
    </div>
  )
}

export function DashboardMock() {
  return (
    <div className="relative max-w-5xl mx-auto select-none">
      {/* Glow */}
      <div className="absolute -inset-4 bg-blue-50/60 rounded-3xl blur-2xl pointer-events-none" />

      {/* Browser chrome */}
      <div className="relative rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-200/60 overflow-hidden">
        {/* Chrome bar */}
        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 border-b border-slate-100">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-300/90" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300/90" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-300/90" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1 text-[11px] text-slate-400 max-w-[220px] w-full">
              <svg className="w-3 h-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15V3m0 12l-3-3m3 3l3-3M3 18h18" />
              </svg>
              app.skillsynq.co.in/dashboard
            </div>
          </div>
        </div>

        {/* App UI */}
        <div className="flex" style={{ minHeight: "420px" }}>
          {/* Sidebar */}
          <div className="hidden md:flex w-48 flex-col border-r border-slate-100 bg-slate-50/50 p-4 gap-1">
            <div className="flex items-center gap-2 mb-5 px-2">
              <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white" />
              </div>
              <span className="text-[12px] font-semibold text-slate-700">SkillSynq</span>
            </div>
            {[
              { icon: "⊞", label: "Dashboard", active: true },
              { icon: "→", label: "Roadmap", active: false },
              { icon: "◎", label: "Milestones", active: false },
              { icon: "↗", label: "Insights", active: false },
            ].map((item) => (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium",
                  item.active
                    ? "bg-white text-slate-900 shadow-sm border border-slate-100"
                    : "text-slate-500"
                )}
              >
                <span className="text-[10px]">{item.icon}</span>
                {item.label}
              </div>
            ))}

            <div className="mt-auto pt-4 border-t border-slate-100">
              <div className="flex items-center gap-2 px-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-[9px] text-white font-bold">SC</div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-700">Sarah Chen</div>
                  <div className="text-[9px] text-slate-400">Pro plan</div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-6 overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-semibold text-slate-900">Good morning, Sarah</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Week 4 of 12 · Senior Eng → Staff Engineer</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-full px-2.5 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                On track
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Readiness score */}
              <div className="col-span-1 bg-white border border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center shadow-sm">
                <ReadinessRing score={72} />
              </div>

              {/* Milestone progress */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Milestones</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">4<span className="text-slate-300 text-base font-medium">/12</span></div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: "33%" }} />
                </div>
                <p className="text-[10px] text-slate-400">2 due this week</p>
              </div>

              {/* Streak */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Streak</div>
                <div className="text-2xl font-bold text-slate-900 mb-1">14<span className="text-slate-400 text-sm font-medium ml-0.5">days</span></div>
                <div className="flex gap-1 mb-2">
                  {[1,1,1,1,1,1,1,0,1,1,1,1,1,1].map((active, i) => (
                    <div key={i} className={cn("h-3 w-2 rounded-sm", active ? "bg-blue-500" : "bg-slate-100")} />
                  ))}
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">Personal best</p>
              </div>
            </div>

            {/* Two columns */}
            <div className="grid grid-cols-2 gap-3">
              {/* Skill readiness */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">Skill Readiness</div>
                <div className="space-y-3">
                  {SKILLS.map((skill) => (
                    <SkillBar key={skill.name} {...skill} />
                  ))}
                </div>
              </div>

              {/* This week */}
              <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-3">This Week</div>
                <div className="space-y-2.5">
                  {MILESTONES.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <div className={cn(
                        "mt-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                        m.done ? "bg-blue-500 border-blue-500" : "border-slate-300"
                      )}>
                        {m.done && (
                          <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-3-3a1 1 0 1 1 1.4-1.4l2.3 2.3 7.3-7.3a1 1 0 0 1 1.4 0z" />
                          </svg>
                        )}
                      </div>
                      <span className={cn(
                        "text-[10.5px] leading-tight",
                        m.done ? "text-slate-400 line-through" : "text-slate-600"
                      )}>
                        {m.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
