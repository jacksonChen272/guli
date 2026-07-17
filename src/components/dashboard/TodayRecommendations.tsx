import { ArrowRight, CircleCheck, Database, ShieldAlert } from 'lucide-react'
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
  const observations = useMemo(() => selectTodayRecommendations(dataset?.results ?? [], 3), [dataset])
  return <section aria-labelledby="today-observations-title" className="space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">今日研究起點</p><h2 id="today-observations-title" className="type-section-title mt-2 font-semibold text-white">今日觀察 Top 3</h2><p className="mt-2 text-sm text-slate-500">沿用既有綜合排序，整理技術、法人與風險條件供進一步研究。</p></div><Button variant="ghost" onClick={() => navigate('/screener')} icon={<ArrowRight size={16}/>}>查看全部觀察名單</Button></header>
    {loading && !dataset ? <Card><LoadingState rows={4}/></Card> : observations.length ? <div className="grid min-w-0 gap-4 lg:grid-cols-3">{observations.map((row, index) => <ObservationCard key={row.symbol} row={row} index={index}/>)}</div> : <Card state="empty"><EmptyState title="今天沒有符合條件的觀察標的" description="市場條件不足時不會補造名單，可前往智慧選股調整篩選條件。"/></Card>}
    <p className="text-xs leading-5 text-slate-600">觀察名單由固定規則整理，僅供資訊參考，不構成投資建議。</p>
  </section>
}

function ObservationCard({ row, index }: { row: ScreenerResult; index: number }) {
  const navigate = useNavigate()
  const positives = unique([...buildTodayRecommendationSignals(row), ...row.reasons]).slice(0, 3)
  const risks = unique(row.risks).slice(0, 2)
  return <Card interactive className="min-w-0" aria-label={`${row.symbol} ${row.name} 今日觀察`}>
    <div className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="mono text-xs text-brand-300">TOP {index + 1} · {row.symbol}</p><h3 className="mt-2 truncate text-xl font-semibold text-white">{row.name}</h3><p className="mono mt-1 text-sm text-slate-500">{formatStockPrice(row.close)} · <span className={(row.changePercent ?? 0) >= 0 ? 'text-red-300' : 'text-emerald-300'}>{signedPercent(row.changePercent)}</span></p></div><Badge tone={riskTone(row.riskLevel)}>{riskLabel(row.riskLevel)}</Badge></div>
      <div className="mt-5 grid grid-cols-3 gap-2"><Score label="Decision" value={formatDecisionScore(row.decisionScore)}/><Score label="Technical" value={formatDecisionScore(row.technicalScore)}/><Score label="Confidence" value={formatConfidence(row.confidence)}/></div>
      <div className="mt-5"><p className="text-xs font-medium text-slate-400">主要正向條件</p><ul className="mt-2 space-y-2">{positives.length ? positives.map((reason) => <li key={reason} className="flex gap-2 text-sm leading-6 text-slate-400"><CircleCheck className="mt-1.5 shrink-0 text-brand-300" size={14}/>{reason}</li>) : <li className="text-sm text-slate-600">目前沒有足夠的正向因子資料</li>}</ul></div>
      <div className="mt-4"><p className="text-xs font-medium text-slate-400">主要風險</p>{risks.length ? <ul className="mt-2 space-y-2">{risks.map((risk) => <li key={risk} className="flex gap-2 text-xs leading-5 text-amber-200/80"><ShieldAlert className="mt-0.5 shrink-0" size={14}/>{risk}</li>)}</ul> : <p className="mt-2 text-xs text-slate-600">目前規則未辨識到額外高風險條件</p>}</div>
      <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-600"><span>資料日期 {row.tradeDate || '—'}</span><span>綜合觀察等級依既有排序</span></div>
      <details className="mt-4 rounded-xl border border-white/[.06] px-3 py-2"><summary className="flex min-h-7 cursor-pointer list-none items-center gap-2 text-xs text-slate-400"><Database size={13}/>查看資料來源</summary><p className="mt-2 border-t border-white/[.05] pt-2 text-xs leading-5 text-slate-600">{row.sourceSummary.length ? row.sourceSummary.join('、') : '尚未取得'}</p></details>
      <Button className="mt-5 w-full" variant="secondary" onClick={() => navigate(`/stock/${row.symbol}`)} icon={<ArrowRight size={16}/>}>查看完整分析</Button>
    </div>
  </Card>
}

function Score({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl border border-white/[.06] px-2 py-3 text-center"><p className="text-[10px] text-slate-600">{label}</p><p className="mono mt-1 truncate text-base font-semibold text-white">{value}</p></div> }
const signedPercent = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const riskLabel = (risk: ScreenerResult['riskLevel']) => risk === 'high' ? '高風險' : risk === 'medium' ? '中度風險' : '低風險'
const riskTone = (risk: ScreenerResult['riskLevel']): 'warning' | 'neutral' | 'brand' => risk === 'high' ? 'warning' : risk === 'medium' ? 'neutral' : 'brand'
const unique = (values: string[]) => [...new Set(values.filter(Boolean))]
