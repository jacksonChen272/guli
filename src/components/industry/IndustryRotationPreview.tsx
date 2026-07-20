import { ArrowRight, Building2, CircleMinus, TrendingDown, TrendingUp } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatAmount } from '../../lib/formatters'
import type { IndustrySnapshot, IndustrySnapshotItem } from '../../types/industrySnapshot'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function IndustryRotationPreview({ snapshot, loading }: { snapshot: IndustrySnapshot | null; loading: boolean }) {
  const navigate = useNavigate()
  const industries = useMemo(() => [...(snapshot?.industries ?? [])].filter((item) => item.industryId !== 'unclassified' && item.return1d !== null).sort((left, right) => (right.return1d ?? -Infinity) - (left.return1d ?? -Infinity)).slice(0, 5), [snapshot])
  return <section aria-labelledby="hot-industries-title" className="space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">今日資金焦點</p><h2 id="hot-industries-title" className="type-section-title mt-2 font-semibold text-white">熱門族群</h2><p className="mt-2 text-sm text-slate-500">依 TWSE 官方產業分類聚合上市普通股行情、成交金額與市場廣度。</p></div><Button variant="ghost" onClick={() => navigate('/industries')} icon={<ArrowRight size={16}/>}>查看產業分析</Button></header>
    {loading && !snapshot ? <Card><LoadingState rows={4}/></Card> : industries.length ? <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">{industries.map((industry, index) => <IndustryCard key={industry.industryId} industry={industry} index={index}/>)}</div> : <Card state="empty"><EmptyState title="尚未取得可比較的族群資料" description="產業資料不足時不會以空值補造排行。"/></Card>}
    <p className="text-xs leading-5 text-slate-600">產業名稱與成分歸屬優先採 TWSE 官方分類；Technical、Decision 與強度為固定規則推導，樣本不足時保留空值。</p>
  </section>
}

function IndustryCard({ industry, index }: { industry: IndustrySnapshotItem; index: number }) {
  const navigate = useNavigate()
  const sourceOfficial = industry.sources.some((source) => source.id === 'twse-industry-mapping' && source.type === 'official')
  return <Card interactive className="min-w-0"><div className="p-5">
    <div className="flex items-center justify-between gap-2"><span className="mono text-xs text-slate-600">#{index + 1}</span><Badge tone={sourceOfficial ? 'info' : 'warning'}>{sourceOfficial ? 'TWSE Official' : 'Partial'}</Badge></div>
    <button type="button" onClick={() => navigate(`/industries/${industry.industryId}`)} className="mt-3 flex min-h-11 w-full items-center gap-2 text-left"><Building2 size={17} className="shrink-0 text-brand-300"/><span className="truncate text-base font-semibold text-white">{industry.industryName}</span></button>
    <div className="mt-3 grid grid-cols-2 gap-2"><Metric label="成分股" value={`${industry.constituentCount ?? '—'} 檔`}/><Metric label="平均漲跌" value={signed(industry.averageChangePercent ?? industry.return1d)} tone={(industry.return1d ?? 0) >= 0 ? 'up' : 'down'}/><Metric label="成交金額" value={formatAmount(industry.tradingAmount)}/><Metric label="上漲／下跌" value={`${industry.advanceCount ?? '—'} / ${industry.declineCount ?? '—'}`}/><Metric label="Technical" value={sample(industry.technicalAverage, industry.technicalSampleCount)}/><Metric label="Decision" value={sample(industry.decisionAverage, industry.decisionSampleCount)}/></div>
    <p className="mt-4 text-xs text-slate-500">代表股票 Top 3</p><div className="mt-2 space-y-1.5">{industry.leaderStocks.slice(0, 3).map((stock) => <button type="button" key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} className="flex min-h-9 w-full min-w-0 items-center justify-between gap-2 rounded-lg border border-white/[.06] px-2.5 text-xs text-slate-300 hover:border-brand-400/25 hover:text-white"><span className="truncate">{stock.symbol} {stock.name}</span><Direction value={stock.changePercent}/></button>)}</div>
    <Button className="mt-4 w-full" size="sm" variant="ghost" onClick={() => navigate(`/industries/${industry.industryId}`)} icon={<ArrowRight size={14}/>}>前往產業分析</Button>
  </div></Card>
}

function Metric({ label, value, tone = 'neutral' }: { label: string; value: string; tone?: 'up' | 'down' | 'neutral' }) { return <div className="min-w-0 rounded-lg border border-white/[.05] p-2.5"><p className="text-[10px] text-slate-600">{label}</p><p className={`mono mt-1 truncate text-xs font-semibold ${tone === 'up' ? 'text-red-300' : tone === 'down' ? 'text-emerald-300' : 'text-slate-200'}`}>{value}</p></div> }
function Direction({ value }: { value: number | null }) { if (value === null) return <CircleMinus size={13} className="text-slate-600"/>; return value >= 0 ? <TrendingUp size={13} className="text-red-300"/> : <TrendingDown size={13} className="text-emerald-300"/> }
const signed = (value: number | null | undefined) => value == null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
const sample = (value: number | null | undefined, count: number | undefined) => value == null ? '—' : `${value.toFixed(1)} · ${count ?? 0} 檔`
