import { Activity, ArrowRight, Building2, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { marketRepository } from '../../services/dataRepository'
import type { RotationPoint } from '../../types/market'
import { WatchlistButton } from '../watchlist/WatchlistButton'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'

const mockStocks = marketRepository.getStocks()

export function RotationDetailDrawer({ point, onClose }: { point: RotationPoint | null; onClose: () => void }) {
  const navigate = useNavigate()
  const stock = point ? mockStocks.find((item) => item.symbol === point.id) ?? mockStocks.find((item) => item.industry === point.industry) : undefined
  if (!point) return <Drawer open={false} onClose={onClose} title="詳細資料"><div /></Drawer>
  const metrics = [
    ['資金流向', `${point.capitalFlow.toFixed(1)} 億`], ['資金動能', point.momentum.toFixed(1)], ['20 日累計', `${point.cumulative20d.toFixed(1)} 億`],
    ['外資', `${point.institutions.foreign.toFixed(1)} 百萬`], ['投信', `${point.institutions.trust.toFixed(1)} 百萬`], ['自營商', `${point.institutions.dealer.toFixed(1)} 百萬`],
  ]
  return <Drawer open title={`${point.name} 詳細資料`} onClose={onClose}><div className="space-y-6 p-5"><div className="rounded-2xl border border-brand-400/10 bg-brand-400/[0.045] p-5"><div className="flex items-start justify-between"><div><Badge tone="brand">{point.industry}</Badge><h3 className="mt-3 text-xl font-semibold text-white">{point.name}</h3><p className="mono mt-1 text-[10px] text-slate-600">{point.id}</p></div><div className="text-right">{point.price && <p className="mono text-lg text-white">{point.price.toLocaleString()}</p>}<p className={`mono mt-1 text-xs ${point.changePercent >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{point.changePercent > 0 ? '+' : ''}{point.changePercent.toFixed(2)}%</p></div></div></div><div className="grid grid-cols-2 gap-3">{metrics.map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><p className="text-[10px] text-slate-600">{label}</p><p className="mono mt-2 text-xs text-slate-200">{value}</p></div>)}</div><div className="rounded-2xl border border-white/[0.06] p-4"><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-slate-300"><Activity size={15} className="text-brand-300" /> 健康分數</span><span className="mono text-xl text-brand-300">{point.healthScore}</span></div><div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.05]"><div className="h-full rounded-full bg-brand-400" style={{ width: `${point.healthScore}%` }} /></div></div><div className="grid gap-2 sm:grid-cols-2">{stock && <WatchlistButton symbol={stock.symbol} />}<Button onClick={() => { onClose(); navigate(stock ? `/stock/${stock.symbol}` : '/stock-analysis') }} icon={<TrendingUp size={14} />}>查看個股健檢</Button></div><Button variant="ghost" className="w-full" onClick={() => { onClose(); navigate(`/capital-flow?industry=${encodeURIComponent(point.industry)}`) }} icon={<Building2 size={14} />}>查看相關產業 <ArrowRight size={13} /></Button></div></Drawer>
}
