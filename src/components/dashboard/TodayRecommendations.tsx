import { ArrowRight, CircleCheck, ShieldAlert } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatConfidence, formatDecisionScore, formatStockPrice } from '../../lib/formatters'
import { buildTodayRecommendationSignals, selectTodayRecommendations } from '../../services/screener/ScreenerRankingService'
import type { ScreenerDataset, ScreenerResult } from '../../types/screener'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function TodayRecommendations({ dataset, loading }: { dataset: ScreenerDataset | null; loading: boolean }) {
  const navigate = useNavigate()
  const recommendations = useMemo(() => selectTodayRecommendations(dataset?.results ?? [], 3), [dataset])
  return (
    <section aria-labelledby="today-recommendations-title" className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">今日觀察候選</p><h2 id="today-recommendations-title" className="type-section-title mt-2 font-semibold text-white">今日推薦 Top 3</h2><p className="mt-2 text-sm text-slate-500">依固定市場、技術與法人規則排序，作為今日研究起點。</p></div>
        <Button variant="ghost" onClick={() => navigate('/screener')} icon={<ArrowRight size={16}/>}>查看全部候選</Button>
      </header>
      {loading && !dataset ? <Card><LoadingState rows={4}/></Card> : recommendations.length ? (
        <div className="grid min-w-0 gap-4 lg:grid-cols-3">
          {recommendations.map((row, index) => <RecommendationCard key={row.symbol} row={row} index={index}/>) }
        </div>
      ) : <Card state="empty"><EmptyState title="今天沒有符合條件的候選" description="市場條件不足時不會勉強產生推薦名單。"/></Card>}
      <p className="text-xs leading-5 text-slate-600">今日推薦為規則型觀察名單，不代表報酬保證，也不構成投資建議。</p>
    </section>
  )
}

function RecommendationCard({ row, index }: { row: ScreenerResult; index: number }) {
  const navigate = useNavigate()
  const signals = buildTodayRecommendationSignals(row)
  return <Card interactive className="min-w-0" aria-label={`${row.symbol} ${row.name} 今日推薦`}>
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mono text-xs text-brand-300">TOP {index + 1} · {row.symbol}</p><h3 className="mt-2 truncate text-xl font-semibold text-white">{row.name}</h3><p className="mono mt-1 text-sm text-slate-500">{formatStockPrice(row.close)} · <span className={(row.changePercent ?? 0) >= 0 ? 'text-red-300' : 'text-emerald-300'}>{signedPercent(row.changePercent)}</span></p></div><Badge tone={row.riskLevel === 'high' ? 'warning' : 'brand'}>{row.riskLevel === 'high' ? '需留意風險' : '條件完整'}</Badge></div>
      <div className="mt-5 grid grid-cols-3 gap-2"><Score label="市場判讀" value={formatDecisionScore(row.decisionScore)}/><Score label="技術分數" value={formatDecisionScore(row.technicalScore)}/><Score label="信心" value={formatConfidence(row.confidence)}/></div>
      <div className="mt-5 flex flex-wrap gap-2">{signals.map((signal) => <span key={signal} className="inline-flex min-h-8 items-center gap-1.5 rounded-lg border border-white/[.07] bg-white/[.025] px-2.5 text-xs text-slate-300"><CircleCheck size={13} className="text-brand-300"/>{signal}</span>)}</div>
      <ul className="mt-5 space-y-2">{row.reasons.slice(0, 2).map((reason) => <li key={reason} className="flex gap-2 text-sm leading-6 text-slate-400"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-400"/>{reason}</li>)}</ul>
      {row.risks[0] && <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-amber-200/80"><ShieldAlert className="mt-0.5 shrink-0" size={14}/>{row.risks[0]}</p>}
      <Button className="mt-5 w-full" variant="secondary" onClick={() => navigate(`/stock/${row.symbol}`)} icon={<ArrowRight size={16}/>}>進入個股分析</Button>
    </div>
  </Card>
}

function Score({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl border border-white/[.06] px-2 py-3 text-center"><p className="text-[10px] text-slate-600">{label}</p><p className="mono mt-1 truncate text-base font-semibold text-white">{value}</p></div> }
const signedPercent = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
