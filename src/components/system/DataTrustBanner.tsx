import { ShieldCheck, TriangleAlert } from 'lucide-react'
import { evaluateDataTrust } from '../../services/BetaDataGuard'
import { useBetaModeStore } from '../../stores/betaModeStore'
import type { DataSourceKind } from '../../types/dataTrust'
import { Badge } from '../ui/Badge'

export function DataTrustBanner({
  sources,
  stale = false,
  message,
}: {
  sources: DataSourceKind[]
  stale?: boolean
  message?: string
}) {
  const publicBetaMode = useBetaModeStore((state) => state.publicBetaMode)
  const report = evaluateDataTrust(sources, stale)
  if (!publicBetaMode) return null
  const safe = report.status === 'Official'
  return (
    <aside
      className={`mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between ${safe ? 'border-brand-400/15 bg-brand-400/[.035]' : 'border-amber-400/15 bg-amber-400/[.035]'}`}
      aria-label="公開測試資料可信度">
      <span className="flex items-start gap-2 text-slate-300">
        {safe
          ? <ShieldCheck size={16} className="mt-0.5 shrink-0 text-brand-300"/>
          : <TriangleAlert size={16} className="mt-0.5 shrink-0 text-amber-300"/>}
        {message ?? report.message}
      </span>
      <Badge tone={safe ? 'brand' : 'warning'}>{report.status}</Badge>
    </aside>
  )
}
