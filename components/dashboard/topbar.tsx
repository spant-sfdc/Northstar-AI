import { Flame } from "lucide-react"
import type { MockUser } from "@/lib/mock-data"

interface TopbarProps {
  user: MockUser
  greeting: string
  streakDays: number
}

export function Topbar({ user, greeting, streakDays }: TopbarProps) {
  return (
    <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div>
        <h1 className="text-[17px] font-bold text-slate-900 tracking-tight">
          {greeting}, {user.name.split(" ")[0]}
        </h1>
        <p className="text-[12.5px] text-slate-400 mt-0.5">
          Week {user.weekNumber} of {user.timelineMonths * 4} ·{" "}
          <span className="text-slate-600 font-medium">{user.targetRole}</span>
        </p>
      </div>

      <div className="flex items-center gap-3">
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
            <span className="text-[12px] font-semibold text-amber-700">
              {streakDays}-day streak
            </span>
          </div>
        )}
      </div>
    </header>
  )
}
