"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Map,
  CheckSquare,
  Zap,
  CreditCard,
  LogOut,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/dashboard",   label: "Dashboard",  icon: LayoutDashboard, active: true  },
  { href: "/roadmap",     label: "Roadmap",    icon: Map,             active: false },
  { href: "/milestones",  label: "Milestones", icon: CheckSquare,     active: false },
  { href: "/skills",      label: "Skills",     icon: Zap,             active: false },
]

interface SidebarProps {
  userName:      string
  userEmail:     string
  trialDaysLeft?: number   // undefined = not trialing, 0 = expired, >0 = active trial
}

export function Sidebar({ userName, userEmail, trialDaysLeft }: SidebarProps) {
  const showTrialBadge = typeof trialDaysLeft === "number" && trialDaysLeft <= 3
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col w-[220px] flex-shrink-0 bg-white border-r border-slate-100 h-screen sticky top-0">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <Star className="w-3.5 h-3.5 text-white fill-white" />
          </div>
          <span className="text-[14px] font-bold text-slate-900 tracking-tight">SkillSynq</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          const isComingSoon = !item.active && item.href !== "/dashboard"

          return (
            <div key={item.href}>
              {isComingSoon ? (
                <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 cursor-not-allowed">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-[13px] font-medium">{item.label}</span>
                  <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-slate-300">Soon</span>
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors",
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                  )}
                >
                  <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-indigo-600")} />
                  <span className={cn("text-[13px] font-medium", isActive && "font-semibold")}>
                    {item.label}
                  </span>
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 pb-4 space-y-0.5 border-t border-slate-100 pt-3">
        <Link
          href="/settings/billing"
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          <span className="text-[13px] font-medium">Billing</span>
          {showTrialBadge && (
            <span className="ml-auto text-[9px] font-bold uppercase tracking-widest bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full">
              {trialDaysLeft}d
            </span>
          )}
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-[13px] font-medium">Sign out</span>
          </button>
        </form>

        {/* User info */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-2">
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <span className="text-[11px] font-bold text-indigo-700">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-slate-700 truncate">{userName}</p>
            <p className="text-[10px] text-slate-400 truncate">{userEmail}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
