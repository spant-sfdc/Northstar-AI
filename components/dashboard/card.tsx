import { cn } from "@/lib/utils"

interface DashboardCardProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function DashboardCard({
  title,
  subtitle,
  action,
  children,
  className,
  noPadding = false,
}: DashboardCardProps) {
  return (
    <div className={cn("bg-white rounded-2xl border border-slate-100 shadow-sm", className)}>
      <div className={cn("flex items-start justify-between", noPadding ? "px-6 pt-6 pb-4" : "px-6 pt-6 pb-2")}>
        <div>
          <h3 className="text-[14px] font-semibold text-slate-800 tracking-tight">{title}</h3>
          {subtitle && (
            <p className="text-[12px] text-slate-400 mt-0.5 leading-snug">{subtitle}</p>
          )}
        </div>
        {action && <div className="ml-4 flex-shrink-0">{action}</div>}
      </div>
      <div className={cn(noPadding ? "" : "px-6 pb-6")}>{children}</div>
    </div>
  )
}
