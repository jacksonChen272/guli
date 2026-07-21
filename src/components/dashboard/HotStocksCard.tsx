import { ArrowRight, Flame, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatAmount, formatStockPrice } from '../../lib/formatters'
import type { HotStockItem } from '../../types/dashboardIntelligence'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function HotStocksCard({ stocks, loading }: { stocks: HotStockItem[]; loading: boolean }) {
  const navigate = useNavigate()
  return <Card title="熱門股票" eyebrow="TWSE OFFICIAL · TOP 5" action={<Badge tone="info">成交值 × 成交量 × 漲跌幅</Badge>}>
    {loading && !stocks.length ? <LoadingState rows={4}/> : stocks.length ? <div className="grid min-w-0 gap-px bg-white/[.06] sm:grid-cols-2 xl:grid-cols-5">{stocks.map((stock) => { const up = (stock.changePercent ?? 0) >= 0; const Icon = up ? TrendingUp : TrendingDown; return <button type="button" key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} className="group min-w-0 bg-[var(--bg-card)] p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:bg-white/[.025] sm:p-5"><div className="flex items-center justify-between gap-2"><span className="mono text-xs text-slate-600">#{stock.rank}</span><span className="flex items-center gap-1 text-xs text-amber-300"><Flame size={13}/>{stock.hotScore.toFixed(1)}</span></div><p className="mt-3 truncate text-sm font-semibold text-white">{stock.symbol} {stock.name}</p><div className="mt-3 flex items-end justify-between gap-2"><p className="mono text-lg text-slate-100">{formatStockPrice(stock.close)}</p><p className={`mono flex items-center gap-1 text-sm ${up ? 'text-red-300' : 'text-emerald-300'}`}><Icon size={14}/>{stock.changePercent === null ? '—' : `${stock.changePercent > 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%`}</p></div><p className="mt-3 truncate text-xs text-slate-500">成交值 {formatAmount(stock.tradingAmount)}</p><p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-600">{stock.reasons[0]}</p><span className="mt-3 flex items-center gap-1 text-xs text-brand-300 opacity-70 transition group-hover:opacity-100">個股分析<ArrowRight size={13}/></span></button> })}</div> : <EmptyState title="尚未取得熱門股票" description="官方個股盤後資料不足時不建立推測排行。"/>}
  </Card>
}

