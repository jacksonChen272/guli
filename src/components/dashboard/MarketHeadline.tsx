import { BrainCircuit, ChevronDown, Clock3, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { generateMarketHeadline } from '../../services/marketInsightService'
import { Badge } from '../ui/Badge'

export function MarketHeadline() {
  const insight = useMemo(() => generateMarketHeadline(), [])
  const [expanded, setExpanded] = useState(false)
  return <section className="panel overflow-hidden border-brand-400/15" aria-labelledby="market-headline-title">
    <div className="flex flex-col gap-4 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2"><BrainCircuit size={15} className="text-brand-300"/><p id="market-headline-title" className="eyebrow">今日市場一句話</p><Badge tone="brand">{insight.marketState}</Badge></div>
        <p className="mt-3 max-w-4xl text-base font-medium leading-7 text-white sm:text-lg">{insight.headline}</p>
        <div className="mt-3 flex flex-wrap gap-2">{insight.tags.map((tag) => <span key={tag} className="rounded-full border border-[var(--border-subtle)] px-2.5 py-1 text-[10px] text-slate-400">#{tag}</span>)}</div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 lg:flex-col lg:items-end">
        <span className="flex items-center gap-1.5 text-[10px] text-slate-500"><ShieldCheck size={13}/>信心程度 {insight.confidence}%</span>
        <span className="flex items-center gap-1.5 text-[10px] text-slate-600"><Clock3 size={12}/>{insight.updatedAt}</span>
        <button type="button" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-subtle)] px-3 text-xs text-slate-300 transition hover:border-brand-400/30 hover:text-brand-300">為什麼？<ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`}/></button>
      </div>
    </div>
    <div className={`grid transition-[grid-template-rows] duration-200 ${expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}><div className="overflow-hidden"><div className="grid gap-3 border-t border-[var(--border-subtle)] bg-white/[0.015] p-5 sm:grid-cols-2">{insight.reasons.map((reason, index) => <div key={reason} className="flex gap-3 text-[11px] leading-5 text-slate-400"><span className="mono text-brand-400">0{index + 1}</span><span>{reason}</span></div>)}</div></div></div>
  </section>
}
