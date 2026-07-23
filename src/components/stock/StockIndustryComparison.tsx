import { Building2, Medal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

const show = (value: number | null | undefined, suffix = '') => value === null || value === undefined ? '尚未取得' : `${value.toFixed(1)}${suffix}`

export function StockIndustryComparison({ data }: { data: StockAnalysisData }) {
  const navigate = useNavigate()
  const industry = data.industrySnapshot
  const mapping = data.industryMapping
  if (!mapping?.industryCode || !industry) return <Card title="同產業比較" eyebrow="OFFICIAL INDUSTRY MAPPING"><EmptyState title="產業比較尚未取得" description="不會以股票名稱猜測產業分類。"/></Card>
  const changePercent = data.quote?.change === null || data.quote?.close === null || data.quote?.change === undefined || data.quote?.close === undefined || data.quote.close === data.quote.change ? null : data.quote.change / (data.quote.close - data.quote.change) * 100
  return <Card title={`${mapping.industryName ?? industry.industryName}比較`} eyebrow="OFFICIAL MAPPING · DERIVED SNAPSHOT" action={<Badge tone="info">TWSE Official Industry</Badge>}><div className="grid gap-4 p-5 lg:grid-cols-[1fr_1.3fr]"><div className="grid grid-cols-2 gap-3"><Metric label="個股今日漲跌" value={show(changePercent, '%')}/><Metric label="產業今日漲跌" value={show(industry.return1d, '%')}/><Metric label="產業相對強度" value={show(industry.relativeStrengthScore)}/><Metric label="產業排名" value={`${industry.rank} / ${industry.constituentCount ?? '—'}`}/><Metric label="個股 Technical" value={show(data.technicalIndex?.technicalScore)}/><Metric label="產業 Technical" value={`${show(industry.technicalAverage)}（${industry.technicalSampleCount ?? 0} 樣本）`}/><Metric label="個股 Decision" value={show(data.decision?.score)}/><Metric label="產業 Decision" value={`${show(industry.decisionAverage)}（${industry.decisionSampleCount ?? 0} 樣本）`}/></div><div className="rounded-xl border border-white/[.06] p-4"><p className="flex items-center gap-2 text-sm font-medium text-white"><Medal size={17} className="text-amber-300"/>產業代表股票 Top 3</p><div className="mt-3 space-y-2">{industry.leaderStocks.slice(0, 3).map((stock, index) => <button key={stock.symbol} type="button" onClick={() => navigate(`/stock/${stock.symbol}`)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left hover:bg-white/[.04]"><span className="min-w-0 truncate text-sm text-white"><span className="mono mr-2 text-slate-500">{index + 1}</span>{stock.name} <span className="text-slate-500">{stock.symbol}</span></span><span className={`mono shrink-0 text-xs ${(stock.changePercent ?? 0) >= 0 ? 'text-red-300' : 'text-emerald-300'}`}>{show(stock.changePercent, '%')}</span></button>)}</div><div className="mt-4 flex items-center justify-between border-t border-white/[.06] pt-4"><p className="flex items-center gap-2 text-xs text-slate-500"><Building2 size={14}/>成分股 {industry.constituentCount ?? '尚未取得'} · {mapping.status === 'official' ? '官方分類' : '部分資料'}</p><Button size="sm" onClick={() => navigate(`/industries/${mapping.industryCode}`)}>查看完整產業</Button></div></div></div></Card>
}
function Metric({ label, value }: { label: string; value: string }) { return <div className="min-w-0 rounded-xl border border-white/[.06] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mono mt-2 truncate text-sm text-white" title={value}>{value}</p></div> }
