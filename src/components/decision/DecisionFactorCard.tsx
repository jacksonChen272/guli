import { ArrowDownRight, ArrowRight, ArrowUpRight, CircleHelp } from 'lucide-react'
import type { DecisionFactor } from '../../types/decision'
import { Badge } from '../ui/Badge'

const directionMeta = {
  positive: { label: '正向', tone: 'up' as const, icon: ArrowUpRight },
  negative: { label: '壓力', tone: 'down' as const, icon: ArrowDownRight },
  neutral: { label: '中性', tone: 'neutral' as const, icon: ArrowRight },
  unknown: { label: '缺值', tone: 'warning' as const, icon: CircleHelp },
}

export function DecisionFactorCard({ factor }: { factor: DecisionFactor }) {
  const meta = directionMeta[factor.direction]
  const Icon = meta.icon
  return <article className="rounded-xl border border-white/[.06] bg-white/[.018] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[15px] font-semibold text-white">{factor.name}</p>
        <p className="mono mt-1 text-xs text-slate-500">{factor.code} · {factor.sourceType}</p>
      </div>
      <Badge tone={meta.tone}><Icon size={14} className="mr-1" />{meta.label}</Badge>
    </div>
    <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
      <Metric label="分數" value={factor.normalizedScore?.toFixed(1) ?? '—'} />
      <Metric label="權重" value={`${(factor.weight * 100).toFixed(0)}%`} />
      <Metric label="貢獻" value={factor.contribution === null ? '—' : `${factor.contribution > 0 ? '+' : ''}${factor.contribution.toFixed(2)}`} />
    </dl>
    <p className="mt-4 text-sm leading-6 text-slate-400">{factor.explanation}</p>
  </article>
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs text-slate-500">{label}</dt><dd className="mono mt-1 text-sm text-slate-200">{value}</dd></div>
}
