import { Activity, BarChart3, Gauge, TrendingUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { StockHistoryIndex } from '../../types/officialStockHistory'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

type Summary = StockHistoryIndex['summary']

export function TechnicalMarketSnapshot() {
  const [summary, setSummary] = useState<Summary | null>(null)
  useEffect(() => { let active = true; void repositoryHub.stockHistory.getTechnicalSnapshot().then((value) => { if (active) setSummary(value) }).catch(() => { if (active) setSummary(null) }); return () => { active = false } }, [])
  const metrics: Array<[string, number, typeof TrendingUp]> = summary ? [
    ['站上 MA20', summary.aboveMa20Count, TrendingUp], ['RSI 過熱', summary.rsiOverboughtCount, Gauge], ['MACD 黃金交叉', summary.macdGoldenCrossCount, Activity], ['成交量放大', summary.volumeExpansionCount, BarChart3],
  ] : []
  return <Card title="官方歷史行情技術快照" eyebrow="COMPACT · NO MARKET EXTRAPOLATION" action={<Badge tone="info">TWSE Official + Derived</Badge>}>
    {!summary ? <div className="p-5"><LoadingState rows={2}/></div> : <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4 sm:p-5">{
      metrics.map(([label, value, MetricIcon]) => <div key={label} className="rounded-xl border border-white/[.06] p-3"><div className="flex items-center gap-2 text-xs text-slate-500"><MetricIcon size={14}/>{label}</div><p className="mono mt-2 text-xl text-white">{value} <span className="text-xs text-slate-600">檔</span></p></div>)
    }</div>}
    {summary && <p className="border-t border-white/[.06] px-5 py-3 text-[10px] text-slate-600">樣本 {summary.technicalSampleSize} 檔具足夠 TWSE 官方歷史行情；本卡不外推至全市場。</p>}
  </Card>
}
