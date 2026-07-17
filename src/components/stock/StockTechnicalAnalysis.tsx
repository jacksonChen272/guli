import { Activity, AlertTriangle, Database, Gauge, LineChart, Waves } from 'lucide-react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { calculateTechnicalIndicators, createTechnicalSummary } from '../../services/technical/TechnicalIndicatorService'
import { generateTechnicalSignals } from '../../services/technical/TechnicalSignalService'
import { isHistoryStale } from '../../services/stockHistory/StockHistoryValidator'
import type { OfficialStockHistory } from '../../types/officialStockHistory'
import type { TechnicalIndicatorSeries } from '../../types/technicalIndicator'
import { ChartEmptyState } from '../charts/lightweight/ChartEmptyState'
import { ChartErrorState } from '../charts/lightweight/ChartErrorState'
import { ChartToolbar, type ChartVisibility, type HistoryRange } from '../charts/lightweight/ChartToolbar'
import { IndicatorLegend } from '../charts/lightweight/IndicatorLegend'
import { VolumeHistogram } from '../charts/lightweight/VolumeHistogram'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { Disclaimer } from '../ui/Disclaimer'
import { LoadingState } from '../ui/LoadingState'

const CandlestickPriceChart = lazy(() => import('../charts/lightweight/CandlestickPriceChart'))
const rangeDays: Record<HistoryRange, number> = { '1M': 22, '3M': 66, '6M': 132, '1Y': 250, ALL: Number.POSITIVE_INFINITY }
const defaultVisibility: ChartVisibility = { ma5: true, ma20: true, ma60: true, bollinger: false, volume: true }

function sliceSeries(series: TechnicalIndicatorSeries, count: number): TechnicalIndicatorSeries {
  if (!Number.isFinite(count) || series.prices.length <= count) return series
  const start = series.prices.length - count
  return {
    ...series,
    prices: series.prices.slice(start), ma5: series.ma5.slice(start), ma10: series.ma10.slice(start), ma20: series.ma20.slice(start), ma60: series.ma60.slice(start), ma120: series.ma120.slice(start),
    ema12: series.ema12.slice(start), ema26: series.ema26.slice(start), rsi14: series.rsi14.slice(start), stochastic: series.stochastic.slice(start), macd: series.macd.slice(start),
    bollinger: series.bollinger.slice(start), atr14: series.atr14.slice(start), averageVolume20: series.averageVolume20.slice(start), volumeRatio20: series.volumeRatio20.slice(start),
    return20: series.return20.slice(start), return60: series.return60.slice(start), volatility20: series.volatility20.slice(start),
    firstTradeDate: series.prices[start]?.tradeDate ?? null,
  }
}

const iconBySummary = { trend: LineChart, rsi: Gauge, kd: Waves, macd: Activity, volume: Database, volatility: AlertTriangle }

export function StockTechnicalAnalysis({ symbol, activePageComponent = 'StockDetailWithSnapshot' }: { symbol: string; activePageComponent?: string }) {
  const [history, setHistory] = useState<OfficialStockHistory | null>(null)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const [range, setRange] = useState<HistoryRange>('1Y')
  const [visibility, setVisibility] = useState<ChartVisibility>(defaultVisibility)
  const [chartMounted, setChartMounted] = useState(false)

  useEffect(() => {
    let active = true
    setHistory(null); setError('')
    void repositoryHub.stockHistory.getHistory(symbol).then((value) => { if (active) setHistory(value) }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : '歷史行情讀取失敗') })
    return () => { active = false }
  }, [symbol, revision])

  const indicators = useMemo(() => history ? calculateTechnicalIndicators(history.prices) : null, [history])
  const chartSeries = useMemo(() => indicators ? sliceSeries(indicators, rangeDays[range]) : null, [indicators, range])
  const summary = useMemo(() => indicators ? createTechnicalSummary(indicators) : [], [indicators])
  const signals = useMemo(() => indicators ? generateTechnicalSignals(indicators) : [], [indicators])
  const retry = () => { repositoryHub.stockHistory.clearCache(symbol); setRevision((value) => value + 1) }
  const handleChartMounted = useCallback((mounted: boolean) => setChartMounted(mounted), [])
  const resolvedJsonUrl = repositoryHub.stockHistory.getResolvedUrl(symbol)
  const historyLoadStatus = error ? 'error' : !history ? 'loading' : history.prices.length ? 'success' : 'empty'
  const diagnostics = import.meta.env.DEV ? <aside data-testid="stock-history-dev-diagnostics" className="rounded-xl border border-sky-400/20 bg-sky-400/[.04] p-4 text-xs leading-6 text-sky-100">
    <p className="font-semibold">DEV · Stock History Diagnostics</p>
    <dl className="mt-2 grid gap-x-6 sm:grid-cols-2 xl:grid-cols-5">
      <div><dt className="text-sky-300/60">active stock page component</dt><dd>{activePageComponent}</dd></div>
      <div><dt className="text-sky-300/60">history load status</dt><dd>{historyLoadStatus}</dd></div>
      <div className="min-w-0 xl:col-span-2"><dt className="text-sky-300/60">resolved JSON URL</dt><dd className="break-all">{resolvedJsonUrl}</dd></div>
      <div><dt className="text-sky-300/60">recordCount / chart mounted</dt><dd>{history?.recordCount ?? 0} / {chartMounted ? 'true' : 'false'}</dd></div>
    </dl>
  </aside> : null

  if (error) return <section className="space-y-4">{diagnostics}<Card title="TWSE 官方歷史行情" eyebrow="OFFICIAL HISTORY"><div className="p-5"><ChartErrorState message={error} onRetry={retry}/></div></Card></section>
  if (!history || !indicators || !chartSeries) return <section className="space-y-4">{diagnostics}<Card title="TWSE 官方歷史行情" eyebrow="OFFICIAL HISTORY"><div className="p-5"><LoadingState rows={6}/></div></Card></section>
  if (!history.prices.length) return <section className="space-y-4">{diagnostics}<Card title="TWSE 官方歷史行情" eyebrow="OFFICIAL HISTORY"><div className="p-5"><ChartEmptyState/></div></Card></section>

  const stale = isHistoryStale(history.lastTradeDate)
  return <section className="space-y-5" aria-label="官方歷史行情與技術指標">
    {diagnostics}
    <Card title="專業歷史行情" eyebrow="TRADINGVIEW LIGHTWEIGHT CHARTS" action={<div className="flex flex-wrap justify-end gap-2"><Badge tone="info">TWSE Official History</Badge><Badge tone="brand">Derived Technical Indicators</Badge><Badge tone={stale ? 'warning' : 'neutral'}>Stale: {stale ? '是' : '否'}</Badge></div>}>
      <div className="border-b border-white/[.06] px-4 py-3 text-xs text-slate-500 sm:px-5">{history.recordCount} 個實際交易日 · {history.firstTradeDate ?? '尚未取得'}～{history.lastTradeDate ?? '尚未取得'} · 縮放：滾輪／雙指 · 拖曳：平移時間軸</div>
      <ChartToolbar range={range} onRangeChange={setRange} visibility={visibility} onVisibilityChange={setVisibility}/>
      <div className="p-3 sm:p-5"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><IndicatorLegend visible={visibility}/><VolumeHistogram/></div><Suspense fallback={<LoadingState rows={6}/>}><CandlestickPriceChart series={chartSeries} visibility={visibility} onMountedChange={handleChartMounted}/></Suspense></div>
    </Card>

    {history.recordCount < 14 && <div className="rounded-xl border border-amber-400/15 bg-amber-400/[.035] p-4 text-sm text-amber-200">目前歷史行情不足，尚無法計算技術指標。</div>}

    <Card title="技術指標摘要" eyebrow="FIXED FORMULA · NOT AI"><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-3">{summary.map((item) => { const Icon = iconBySummary[item.id]; return <article key={item.id} className="min-w-0 rounded-xl border border-white/[.06] bg-white/[.018] p-4"><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-sm font-medium text-white"><Icon size={16} className="text-brand-300"/>{item.label}</span><Badge tone={item.status.includes('資料不足') ? 'neutral' : item.status.includes('過熱') || item.status.includes('高波動') ? 'warning' : 'info'}>{item.status}</Badge></div><p className="mono mt-4 truncate text-xl text-white">{item.value}</p><p className="mt-2 text-xs leading-5 text-slate-500">{item.explanation}</p><p className="mt-3 text-[10px] text-slate-600">{item.period} · {item.tradeDate ?? '尚未取得'} · {item.source}</p></article> })}</div></Card>

    <Card title="近期技術訊號" eyebrow="RULE-BASED SIGNALS"><div className="grid gap-3 p-5 md:grid-cols-2">{signals.length ? signals.map((signal) => <article key={signal.id} className="rounded-xl border border-white/[.06] p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-white">{signal.name}</p><Badge tone={signal.direction === 'positive' ? 'up' : signal.direction === 'negative' ? 'down' : signal.direction === 'warning' ? 'warning' : 'neutral'}>{signal.severity}</Badge></div><p className="mt-2 text-xs leading-5 text-slate-400">{signal.explanation}</p><p className="mt-3 text-[10px] text-slate-600">{signal.tradeDate} · {signal.formulaVersion}</p></article>) : <p className="text-sm text-slate-500">目前沒有符合固定規則的技術訊號。</p>}</div><div className="border-t border-white/[.06] p-5"><Disclaimer>技術指標與訊號由 TWSE 官方歷史行情依固定公式推導，僅供資訊參考，不構成投資建議。</Disclaimer></div></Card>
  </section>
}
