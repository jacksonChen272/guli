import { ArrowRight, Building2 } from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { IndustrySnapshot } from '../../types/industrySnapshot'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function IndustryRotationPreview({ snapshot, loading }: { snapshot: IndustrySnapshot | null; loading: boolean }) {
  const navigate = useNavigate()
  const industries = useMemo(() => [...(snapshot?.industries ?? [])].sort((left, right) => (right.return1d ?? -Infinity) - (left.return1d ?? -Infinity)).slice(0, 5), [snapshot])
  return <section aria-labelledby="hot-industries-title" className="space-y-4">
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">今日資金焦點</p><h2 id="hot-industries-title" className="type-section-title mt-2 font-semibold text-white">熱門族群</h2><p className="mt-2 text-sm text-slate-500">依今日漲幅排序，搭配族群代表股票快速掌握市場主流。</p></div><Button variant="ghost" onClick={() => navigate('/industries')} icon={<ArrowRight size={16}/>}>查看產業分析</Button></header>
    {loading && !snapshot ? <Card><LoadingState rows={4}/></Card> : industries.length ? <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">{industries.map((industry, index) => <Card key={industry.industryId} interactive className="min-w-0"><div className="p-5"><div className="flex items-center justify-between"><span className="mono text-xs text-slate-600">#{index + 1}</span><Badge tone={(industry.return1d ?? 0) >= 0 ? 'up' : 'down'}>{signed(industry.return1d)}</Badge></div><button type="button" onClick={() => navigate(`/industries/${industry.industryId}`)} className="mt-4 flex min-h-11 w-full items-center gap-2 text-left"><Building2 size={17} className="shrink-0 text-brand-300"/><span className="truncate text-base font-semibold text-white">{industry.industryName}</span></button><p className="mt-3 text-xs text-slate-500">代表股票</p><div className="mt-2 flex min-w-0 flex-wrap gap-2">{industry.leaderStocks.slice(0, 2).map((stock) => <button type="button" key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} className="min-h-9 max-w-full truncate rounded-lg border border-white/[.07] px-2.5 text-xs text-slate-300 hover:border-brand-400/25 hover:text-white">{stock.symbol} {stock.name}</button>)}</div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-brand-400/70" style={{ width: `${Math.max(8, Math.min(100, industry.strengthScore))}%` }}/></div><p className="mono mt-2 text-[11px] text-slate-600">族群強度 {industry.strengthScore}</p></div></Card>)}</div> : <Card state="empty"><EmptyState title="尚未取得熱門族群" description="資料不足時不會以空值推測產業表現。"/></Card>}
    <p className="text-xs leading-5 text-slate-600">產業分類與強度包含規則推導及部分模擬欄位；今日漲跌顏色採台股紅漲、綠跌。</p>
  </section>
}
const signed = (value: number | null) => value === null ? '尚未取得' : `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
