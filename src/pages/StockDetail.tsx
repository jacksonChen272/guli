import { ArrowLeft, Building2, ShieldCheck, TrendingUp } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { MiniSparkline } from '../components/charts/MiniSparkline'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { WatchlistButton } from '../components/watchlist/WatchlistButton'
import { getStockBySymbol } from '../data/mockStocks'

export function StockDetail() {
  const { symbol = '' } = useParams()
  const stock = getStockBySymbol(symbol)
  const navigate = useNavigate()
  if (!stock) return <Card><EmptyState title="找不到這檔股票" description="請重新搜尋有效的股票代號。" /></Card>
  const up = stock.changePercent >= 0
  return <div className="space-y-6"><SectionHeader eyebrow="Stock Health · Preview" title={`${stock.name} ${stock.symbol}`} description="個股分析基礎資訊與法人籌碼摘要" action={<div className="flex gap-2"><Button variant="ghost" onClick={() => navigate(-1)} icon={<ArrowLeft size={14} />}>返回</Button><WatchlistButton symbol={stock.symbol} /></div>} />
    <div className="grid gap-6 lg:grid-cols-12"><Card className="lg:col-span-7"><div className="p-5 sm:p-6"><div className="flex flex-col justify-between gap-6 sm:flex-row"><div><Badge tone="brand">{stock.industry}</Badge><p className="mono mt-5 text-4xl font-medium text-white">{stock.price.toLocaleString()}</p><p className={`mono mt-2 text-sm ${up ? 'text-red-400' : 'text-emerald-400'}`}>{stock.change > 0 ? '+' : ''}{stock.change.toFixed(2)}　{stock.changePercent > 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%</p></div><div className="w-full sm:w-56"><MiniSparkline data={stock.priceHistory} positive={up} /><p className="mt-2 text-right text-[10px] text-slate-600">近 20 個交易日</p></div></div><div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">{[['市場', stock.board === 'listed' ? '上市' : '上櫃'], ['成交量', `${stock.volume.toLocaleString()} 張`], ['資金流向', `${stock.capitalFlow.toFixed(1)} 億`], ['20 日累計', `${stock.cumulative20d.toFixed(1)} 億`]].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><p className="text-[10px] text-slate-600">{label}</p><p className="mono mt-2 text-xs text-slate-200">{value}</p></div>)}</div></div></Card>
      <Card className="lg:col-span-5" title="健康分數" eyebrow="Health Score"><div className="p-5 sm:p-6"><div className="flex items-center gap-5"><div className="grid h-24 w-24 place-items-center rounded-full border-[9px] border-brand-400/20 bg-brand-400/[0.04]"><span className="mono text-3xl text-brand-300">{stock.healthScore}</span></div><div><p className="text-sm font-medium text-white">籌碼結構健康</p><p className="mt-2 text-xs leading-6 text-slate-500">法人資金與價格動能維持正向，市場關注度高。</p></div></div></div></Card>
    </div>
    <Card title="法人摘要" eyebrow="Institutional Flow"><div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">{[['外資', stock.institutions.foreign], ['投信', stock.institutions.trust], ['自營商', stock.institutions.dealer]].map(([label, raw]) => { const value = Number(raw); return <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Building2 size={14} />{label}</div><p className={`mono mt-4 text-lg ${value >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>{value > 0 ? '+' : ''}{value.toFixed(1)} 百萬</p></div> })}</div></Card>
    <div className="panel flex flex-col items-center justify-center p-10 text-center"><ShieldCheck size={28} className="text-brand-300" /><h3 className="mt-4 text-base font-semibold text-white">個股健檢模組建置中</h3><p className="mt-2 text-sm text-slate-500">詳細健檢功能將於下一版本完成</p><Button className="mt-5" onClick={() => navigate('/capital-flow')} icon={<TrendingUp size={14} />}>查看資金輪動</Button></div>
  </div>
}
