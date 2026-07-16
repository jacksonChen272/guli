import { ArrowDown, ArrowRight, ArrowUp, CircleMinus, CirclePlus } from 'lucide-react'
import type { OfficialMarketOverview } from '../../types/marketData'
import { Badge } from '../ui/Badge'

export function MarketBreadth({ data }: { data?: OfficialMarketOverview }) {
  const official = data?.status === 'official'
  const source = official ? 'TWSE Official' : data?.status === 'partial' ? 'TWSE 部分資料' : 'Fallback'
  const entries = [
    { label: '上漲家數', value: data?.advanceCount, icon: ArrowUp, color: 'text-red-300' },
    { label: '下跌家數', value: data?.declineCount, icon: ArrowDown, color: 'text-emerald-300' },
    { label: '平盤家數', value: data?.unchangedCount, icon: ArrowRight, color: 'text-slate-300' },
    { label: '漲停家數', value: data?.limitUpCount, icon: CirclePlus, color: 'text-red-300' },
    { label: '跌停家數', value: data?.limitDownCount, icon: CircleMinus, color: 'text-emerald-300' },
  ]
  return <div className="space-y-2">
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="TWSE 上市股票市場廣度">
      {entries.map(({ label, value, icon: Icon, color }) => <article key={label} className="panel flex min-h-24 items-center justify-between gap-3 px-4 py-3">
        <div><p className="text-[10px] text-slate-500">{label}</p><p className={`mono mt-2 text-xl font-medium ${color}`}>{value === null || value === undefined ? '—' : value.toLocaleString('zh-TW')}</p></div>
        <div className="flex flex-col items-end gap-2"><Icon size={17} className={color}/><Badge tone={official ? 'brand' : data?.status === 'partial' ? 'info' : 'warning'}>{source}</Badge></div>
      </article>)}
    </section>
    <p className="px-1 text-[10px] leading-5 text-slate-600">市場廣度來源：{data?.breadthSource === 'twtazu_od' ? 'TWSE twtazu_od 官方統計' : 'TWSE STOCK_DAY_ALL 同交易日上市股票資料彙整'}；缺值不以 Mock 或 0 取代。</p>
  </div>
}
