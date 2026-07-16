import { ArrowDownRight, ArrowUpRight, Info } from 'lucide-react'
import type { PricePoint } from '../../types/market'
import type { MarketFieldSource } from '../../types/marketData'
import { MiniSparkline } from '../charts/MiniSparkline'
import { Badge } from '../ui/Badge'
import { Tooltip } from '../ui/Tooltip'

const sourceMeta: Record<MarketFieldSource, { label: string; tone: 'brand' | 'neutral' | 'warning' | 'info' }> = {
  official: { label: 'TWSE Official', tone: 'brand' }, mock: { label: '模擬資料', tone: 'neutral' },
  fallback: { label: '回退資料', tone: 'warning' }, partial: { label: '部分資料', tone: 'info' },
}

interface MarketStatCardProps {
  name: string; code: string; value: number; unit?: string; change: number; changePercent: number
  previousValue: number; trend: PricePoint[]; decimals?: number; source?: MarketFieldSource; updatedAt?: string
}

export function MarketStatCard({ name, code, value, unit = '', change, changePercent, previousValue, trend, decimals = 2, source = 'mock', updatedAt = '盤後資料' }: MarketStatCardProps) {
  const up = change >= 0
  const format = (number: number) => number.toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  const meta = sourceMeta[source]
  return <article className="panel card-interactive min-w-[236px] p-4 sm:min-w-0">
    <div className="flex items-start justify-between gap-2"><div><div className="flex items-center gap-1.5"><p className="text-[11px] font-medium text-slate-300">{name}</p><Tooltip label={`${name}最近 20 個交易日趨勢`}><Info size={11} className="text-slate-700"/></Tooltip></div><p className="mono mt-1 text-[8px] tracking-widest text-slate-700">{code}</p></div><Badge tone={meta.tone}>{meta.label}</Badge></div>
    <div className="mt-3 flex items-end justify-between gap-2"><div><p className="mono text-[21px] font-medium text-white">{format(value)}<span className="ml-1 text-[9px] text-slate-600">{unit}</span></p><p className={`mono mt-1.5 flex items-center gap-1 text-[10px] ${up ? 'text-red-400' : 'text-emerald-400'}`}>{up ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>} {change > 0 ? '+' : ''}{format(change)} · {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%</p></div><MiniSparkline data={trend} positive={up}/></div>
    <div className="mt-3 flex items-center justify-between border-t border-[var(--border-subtle)] pt-2.5"><span className="text-[8px] text-slate-600">前值 {format(previousValue)} {unit}</span><span className="mono text-[8px] text-slate-700">{updatedAt}</span></div>
  </article>
}
