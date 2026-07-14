import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react'
import type { OfficialMarketOverview } from '../../types/marketData'
import { Badge } from '../ui/Badge'

export function MarketBreadth({ data }: { data?: OfficialMarketOverview }) {
  const source = data?.status === 'official' ? '官方 TWSE' : data?.status === 'partial' ? '部分資料' : data?.status === 'fallback' ? '回退資料' : '模擬資料'
  const entries = [
    { label: '上漲家數', value: data?.advanceCount, icon: ArrowUp, color: 'text-red-300' },
    { label: '下跌家數', value: data?.declineCount, icon: ArrowDown, color: 'text-emerald-300' },
    { label: '平盤家數', value: data?.unchangedCount, icon: ArrowRight, color: 'text-slate-300' },
  ]
  return <section className="grid gap-3 sm:grid-cols-3" aria-label="上市市場漲跌家數">
    {entries.map(({ label, value, icon: Icon, color }) => <article key={label} className="panel flex min-h-24 items-center justify-between gap-3 px-4 py-3"><div><p className="text-[10px] text-slate-500">{label}</p><p className={`mono mt-2 text-xl font-medium ${color}`}>{value === null || value === undefined ? '—' : value.toLocaleString('zh-TW')}</p></div><div className="flex flex-col items-end gap-2"><Icon size={17} className={color}/><Badge tone={data?.status === 'official' ? 'brand' : data?.status === 'partial' ? 'info' : data?.status === 'fallback' ? 'warning' : 'neutral'}>{source}</Badge></div></article>)}
  </section>
}
