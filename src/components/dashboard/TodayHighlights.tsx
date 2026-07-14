import { ArrowRight, ChevronDown, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { generateMarketHighlights } from '../../services/marketInsightService'
import type { MarketHighlight } from '../../types/insight'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const directionMeta = {
  positive: { label: '正向', className: 'border-l-red-400', icon: TrendingUp },
  neutral: { label: '中性', className: 'border-l-blue-400', icon: Sparkles },
  warning: { label: '警示', className: 'border-l-amber-400', icon: TrendingDown },
}

export function HighlightCard({ item }: { item: MarketHighlight }) {
  const navigate = useNavigate()
  const meta = directionMeta[item.direction]
  const Icon = meta.icon
  return <article className={`rounded-2xl border border-[var(--border-subtle)] border-l-2 ${meta.className} bg-white/[0.018] p-4 transition hover:-translate-y-0.5 hover:border-[var(--border-strong)]`}>
    <div className="flex items-start justify-between gap-3"><div className="flex flex-wrap gap-2"><Badge tone={item.direction === 'warning' ? 'warning' : item.direction === 'positive' ? 'up' : 'info'}>{item.type}</Badge><span className="flex items-center gap-1 text-[10px] text-slate-500"><Icon size={12}/>{meta.label}</span></div><span className="flex items-center gap-1 text-[10px] text-slate-500"><ShieldAlert size={11}/>風險 {item.riskLevel}</span></div>
    <h3 className="mt-3 text-sm font-semibold text-white">{item.title}</h3><p className="mt-2 text-[11px] leading-5 text-slate-500">{item.description}</p>
    <div className="mt-4 flex items-end justify-between gap-3"><div><div className="flex flex-wrap gap-1">{item.related.map((tag) => <span key={tag} className="text-[9px] text-slate-600">#{tag}</span>)}</div><div className="mt-2 h-1 w-24 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-brand-400" style={{ width: `${item.intensity}%` }}/></div></div><button type="button" onClick={() => navigate(item.targetPath)} className="flex min-h-11 items-center gap-1 text-[10px] text-brand-300 hover:text-brand-200">查看詳情<ArrowRight size={12}/></button></div>
  </article>
}

export function TodayHighlights({ limit = 3, expandable = true }: { limit?: number; expandable?: boolean }) {
  const highlights = useMemo(() => generateMarketHighlights(), [])
  const [expanded, setExpanded] = useState(false)
  const shown = expanded || !expandable ? highlights : highlights.slice(0, limit)
  return <Card title="今天值得注意的三件事" eyebrow="Rule-based Insights" action={expandable && highlights.length > limit ? <Button size="sm" variant="ghost" onClick={() => setExpanded((value) => !value)} icon={<ChevronDown size={13} className={expanded ? 'rotate-180' : ''}/>}>{expanded ? '收合' : `展開其餘 ${highlights.length - limit} 筆`}</Button> : undefined}>
    <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3 sm:p-5">{shown.map((item) => <HighlightCard key={item.id} item={item}/>)}</div>
  </Card>
}
