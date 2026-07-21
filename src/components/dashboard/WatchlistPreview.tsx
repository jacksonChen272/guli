import { ArrowRight, Star, TrendingDown, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatStockPrice } from '../../lib/formatters'
import type { WatchlistPreviewItem } from '../../types/dashboardIntelligence'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function WatchlistPreview({ items, loading }: { items: WatchlistPreviewItem[]; loading: boolean }) {
  const navigate = useNavigate()
  return <Card className="h-full" title="我的自選" eyebrow="WATCHLIST" action={<Button size="sm" variant="ghost" onClick={() => navigate('/watchlist')} icon={<ArrowRight size={14}/>}>觀察中心</Button>}>
    {loading && !items.length ? <LoadingState rows={4}/> : items.length ? <div className="p-3">{items.map((item) => { const up = (item.changePercent ?? 0) >= 0; const Icon = up ? TrendingUp : TrendingDown; return <button type="button" key={item.symbol} onClick={() => navigate(`/stock/${item.symbol}`)} className="grid min-h-14 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 text-left transition hover:bg-white/[.025]"><div className="min-w-0"><p className="truncate text-sm font-medium text-white"><Star size={13} className="mr-2 inline text-amber-300"/>{item.symbol} {item.name}</p><p className="mt-1 text-xs text-slate-600">{item.tradeDate ?? '日期尚未取得'}</p></div><div className="text-right"><p className="mono text-sm text-slate-200">{formatStockPrice(item.close)}</p><p className={`mono mt-1 flex items-center justify-end gap-1 text-xs ${item.changePercent === null ? 'text-slate-600' : up ? 'text-red-300' : 'text-emerald-300'}`}><Icon size={12}/>{item.changePercent === null ? '尚未取得' : `${item.changePercent > 0 ? '+' : ''}${item.changePercent.toFixed(2)}%`}</p></div></button> })}</div> : <EmptyState title="自選股目前是空的" description="加入股票後會顯示最多五筆官方盤後行情。"/>}
    <div className="border-t border-white/[.06] px-4 py-3"><Badge tone={items.every((item) => item.source === 'TWSE Official') && items.length ? 'info' : 'warning'}>{items.length ? '行情優先採 TWSE Official' : 'Missing'}</Badge></div>
  </Card>
}

