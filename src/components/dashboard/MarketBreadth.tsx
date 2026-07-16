import { ArrowDown, ArrowRight, ArrowUp, CircleMinus, CirclePlus, Info } from 'lucide-react'
import type { OfficialMarketOverview } from '../../types/marketData'
import { Badge } from '../ui/Badge'
import { Tooltip } from '../ui/Tooltip'
export function MarketBreadth({ data }: { data?: OfficialMarketOverview }) {
  const official = data?.status === 'official'; const source = official ? 'TWSE Official' : data?.status === 'partial' ? 'TWSE 部分資料' : 'Fallback'
  const entries = [
    { label: '上漲家數', value: data?.advanceCount, icon: ArrowUp, color: 'text-red-300', derived: false },
    { label: '下跌家數', value: data?.declineCount, icon: ArrowDown, color: 'text-emerald-300', derived: false },
    { label: '平盤家數', value: data?.unchangedCount, icon: ArrowRight, color: 'text-slate-300', derived: false },
    { label: '漲幅 ≥ 9.5%', value: data?.limitUpCount, icon: CirclePlus, color: 'text-red-300', derived: true },
    { label: '跌幅 ≤ -9.5%', value: data?.limitDownCount, icon: CircleMinus, color: 'text-emerald-300', derived: true },
  ]
  return <div className="space-y-2"><section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" aria-label="TWSE 上市股票市場廣度">{entries.map(({ label, value, icon: Icon, color, derived }) => <article key={label} className="panel flex min-h-24 items-center justify-between gap-3 px-4 py-3"><div><div className="flex items-center gap-1"><p className="text-[10px] text-slate-500">{label}</p>{derived && <Tooltip label="依收盤漲跌幅門檻推導，不是證交所官方漲停／跌停家數。"><span className="inline-flex" aria-label="衍生統計說明"><Info size={11} className="text-amber-300"/></span></Tooltip>}</div><p className={`mono mt-2 text-xl font-medium ${color}`}>{value === null || value === undefined ? '—' : value.toLocaleString('zh-TW')}</p></div><div className="flex flex-col items-end gap-2"><Icon size={17} className={color}/><Badge tone={derived ? 'warning' : official ? 'brand' : data?.status === 'partial' ? 'info' : 'warning'}>{derived ? '衍生統計' : source}</Badge></div></article>)}</section><p className="px-1 text-[10px] leading-5 text-slate-600">上漲／下跌／平盤家數由 TWSE 同交易日資料彙整；「漲幅 ≥ 9.5%」與「跌幅 ≤ -9.5%」為 GULI 依收盤漲跌幅推導，不等同證交所依升降單位計算的正式漲停／跌停家數。缺值不以 Mock 或 0 取代。</p></div>
}
