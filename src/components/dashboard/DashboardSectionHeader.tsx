import { Clock3 } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatDateTime } from '../../lib/formatters'
import { Badge } from '../ui/Badge'

export function DashboardSectionHeader({
  id,
  eyebrow,
  title,
  subtitle,
  updatedAt,
  stale = false,
  action,
}: {
  id: string
  eyebrow?: string
  title: string
  subtitle?: string
  updatedAt?: string | null
  stale?: boolean
  action?: ReactNode
}) {
  return (
    <header className="flex min-w-0 flex-col gap-3 border-b border-white/[.06] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <h2 id={id} className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
          {stale && <Badge tone="warning">資料可能過期</Badge>}
        </div>
        {subtitle && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{subtitle}</p>}
        {updatedAt && <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-600"><Clock3 size={13} aria-hidden="true" />最後更新 {formatDateTime(updatedAt)}</p>}
      </div>
      {action && <div className="flex min-h-11 shrink-0 items-center gap-2">{action}</div>}
    </header>
  )
}
