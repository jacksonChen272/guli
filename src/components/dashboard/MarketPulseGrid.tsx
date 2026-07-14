import { AlertTriangle, ArrowRight, CalendarClock, Radar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { marketRepository } from '../../services/dataRepository'
import { generateMarketHighlights } from '../../services/marketInsightService'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { Card } from '../ui/Card'

export function MarketPulseGrid() {
  const mockStocks = marketRepository.getStocks()
  const mockInsightEvents = marketRepository.getEvents()
  const navigate = useNavigate()
  const items = useWatchlistStore((state) => state.items)
  const alerts = mockStocks.filter((stock) => items.some((item) => item.symbol === stock.symbol)).slice(0, 3)
  const signals = generateMarketHighlights().slice(0, 3)
  return <div className="grid h-full gap-4 md:grid-cols-3"><Card title="今日焦點訊號" eyebrow="Signals"><div className="divide-y divide-[var(--border-subtle)]">{signals.map((signal) => <button type="button" key={signal.id} onClick={() => navigate(signal.targetPath)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[.018]"><Radar size={15} className="shrink-0 text-brand-400"/><span className="min-w-0 flex-1 truncate text-[11px] text-slate-300">{signal.title}</span><ArrowRight size={12} className="text-slate-700"/></button>)}</div></Card><Card title="市場事件" eyebrow="Calendar"><div className="divide-y divide-[var(--border-subtle)]">{mockInsightEvents.slice(0, 3).map((event) => <div key={event.id} className="flex min-h-16 items-center gap-3 px-4 py-3"><CalendarClock size={15} className="shrink-0 text-blue-400"/><div className="min-w-0"><p className="mono text-[8px] text-slate-600">{event.time} · {event.category}</p><p className="mt-1 truncate text-[11px] text-slate-300">{event.title}</p></div></div>)}</div></Card><Card title="自選股異常提醒" eyebrow="Watchlist"><div className="divide-y divide-[var(--border-subtle)]">{alerts.map((stock) => <button type="button" key={stock.symbol} onClick={() => navigate(`/stock/${stock.symbol}`)} className="flex min-h-16 w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[.018]"><AlertTriangle size={15} className="shrink-0 text-amber-400"/><div className="min-w-0 flex-1"><p className="text-[11px] text-slate-300">{stock.symbol} {stock.name}</p><p className="mt-1 text-[9px] text-slate-600">法人與量價狀態已更新</p></div><span className={`mono text-[10px] ${stock.changePercent >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</span></button>)}</div></Card></div>
}
