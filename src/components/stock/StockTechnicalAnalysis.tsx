import { lazy, Suspense, useCallback, useMemo, useState } from 'react'
import type { StockAnalysisLoadStatus } from '../../hooks/useStockAnalysisData'
import { generateTechnicalSignals } from '../../services/technical/TechnicalSignalService'
import type { OfficialStockHistory } from '../../types/officialStockHistory'
import type { SupportResistanceAnalysis } from '../../types/supportResistance'
import type { TechnicalIndicatorSeries } from '../../types/technicalIndicator'
import { ChartEmptyState } from '../charts/lightweight/ChartEmptyState'
import { ChartErrorState } from '../charts/lightweight/ChartErrorState'
import { ChartToolbar, type ChartVisibility, type HistoryRange } from '../charts/lightweight/ChartToolbar'
import { IndicatorLegend } from '../charts/lightweight/IndicatorLegend'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'
import { TechnicalAnalysisSummary } from './TechnicalAnalysisSummary'

const CandlestickPriceChart = lazy(() => import('../charts/lightweight/CandlestickPriceChart'))
const rangeDays: Record<HistoryRange, number> = { '1M': 22, '3M': 66, '6M': 132, '1Y': 250, ALL: Number.POSITIVE_INFINITY }
const defaultVisibility: ChartVisibility = { ma5: true, ma20: true, ma60: true, ma120: false, bollinger: false, volume: true, zones: true }

export function sliceTechnicalSeries(series: TechnicalIndicatorSeries, count: number): TechnicalIndicatorSeries {
  if (!Number.isFinite(count) || series.prices.length <= count) return series
  const start = series.prices.length - count
  return { ...series, prices: series.prices.slice(start), ma5: series.ma5.slice(start), ma10: series.ma10.slice(start), ma20: series.ma20.slice(start), ma60: series.ma60.slice(start), ma120: series.ma120.slice(start), ema12: series.ema12.slice(start), ema26: series.ema26.slice(start), rsi14: series.rsi14.slice(start), stochastic: series.stochastic.slice(start), macd: series.macd.slice(start), bollinger: series.bollinger.slice(start), atr14: series.atr14.slice(start), averageVolume20: series.averageVolume20.slice(start), volumeRatio20: series.volumeRatio20.slice(start), return20: series.return20.slice(start), return60: series.return60.slice(start), volatility20: series.volatility20.slice(start), firstTradeDate: series.prices[start]?.tradeDate ?? null }
}

interface Props { symbol: string; history: OfficialStockHistory | null; indicators: TechnicalIndicatorSeries | null; priceStructure: SupportResistanceAnalysis | null; loadStatus: StockAnalysisLoadStatus; errors: string[]; historyUrl: string; onRetry: () => void; activePageComponent?: string }

export function StockTechnicalAnalysis({ symbol, history, indicators, priceStructure, loadStatus, errors, historyUrl, onRetry, activePageComponent = 'StockDetailWithSnapshot' }: Props) {
  const [range, setRange] = useState<HistoryRange>('1Y')
  const [visibility, setVisibility] = useState<ChartVisibility>(defaultVisibility)
  const [chartMounted, setChartMounted] = useState(false)
  const chartSeries = useMemo(() => indicators ? sliceTechnicalSeries(indicators, rangeDays[range]) : null, [indicators, range])
  const signals = useMemo(() => indicators ? generateTechnicalSignals(indicators) : [], [indicators])
  const handleChartMounted = useCallback((mounted: boolean) => setChartMounted(mounted), [])
  const historyLoadStatus = errors.some((error) => error.startsWith('官方歷史')) ? 'error' : loadStatus === 'loading' ? 'loading' : history?.prices.length ? 'success' : 'empty'
  const diagnostics = import.meta.env.DEV ? <aside data-testid="stock-history-dev-diagnostics" className="rounded-xl border border-sky-400/20 bg-sky-400/[.04] p-4 text-xs leading-6 text-sky-100"><p className="font-semibold">DEV · Stock History Diagnostics</p><dl className="mt-2 grid gap-x-6 sm:grid-cols-2 xl:grid-cols-5"><div><dt className="text-sky-300/60">active stock page component</dt><dd>{activePageComponent}</dd></div><div><dt className="text-sky-300/60">history load status</dt><dd>{historyLoadStatus}</dd></div><div className="min-w-0 xl:col-span-2"><dt className="text-sky-300/60">resolved JSON URL</dt><dd className="break-all">{historyUrl}</dd></div><div><dt className="text-sky-300/60">recordCount / chart mounted</dt><dd>{history?.recordCount ?? 0} / {chartMounted ? 'true' : 'false'}</dd></div></dl></aside> : null
  if (historyLoadStatus === 'error') return <section className="space-y-4">{diagnostics}<Card title="TWSE 官方歷史行情" eyebrow="OFFICIAL HISTORY"><div className="p-5"><ChartErrorState message={errors.find((error) => error.startsWith('官方歷史')) ?? '歷史行情讀取失敗'} onRetry={onRetry}/></div></Card></section>
  if (historyLoadStatus === 'loading') return <section className="space-y-4">{diagnostics}<Card title="TWSE 官方歷史行情" eyebrow="OFFICIAL HISTORY"><div className="p-5"><LoadingState rows={6}/></div></Card></section>
  if (!history?.prices.length || !indicators || !chartSeries || !priceStructure) return <section className="space-y-4">{diagnostics}<Card title="TWSE 官方歷史行情" eyebrow="OFFICIAL HISTORY"><div className="p-5"><ChartEmptyState/></div></Card></section>
  return <section className="min-w-0 space-y-5" aria-label={`${symbol} 官方歷史行情與技術分析`}>{diagnostics}<Card title="專業 K 線與技術指標" eyebrow="TRADINGVIEW LIGHTWEIGHT CHARTS" action={<div className="flex flex-wrap justify-end gap-2"><Badge tone="info">TWSE Official History</Badge><Badge tone="brand">Derived Indicators</Badge><Badge tone={history.status === 'stale' ? 'warning' : 'neutral'}>{history.status}</Badge></div>}><div className="border-b border-white/[.06] px-4 py-3 text-xs text-slate-500 sm:px-5">{history.recordCount} 個實際交易日 · {history.firstTradeDate ?? '尚未取得'}～{history.lastTradeDate ?? '尚未取得'} · 滾輪／雙指縮放 · 拖曳平移</div><ChartToolbar range={range} onRangeChange={setRange} visibility={visibility} onVisibilityChange={setVisibility}/><div className="min-w-0 p-3 sm:p-5"><IndicatorLegend visible={visibility}/><div className="mt-3"><Suspense fallback={<LoadingState rows={6}/>}><CandlestickPriceChart series={chartSeries} visibility={visibility} zones={priceStructure.zones} onMountedChange={handleChartMounted}/></Suspense></div></div></Card><TechnicalAnalysisSummary series={indicators} trend={priceStructure.trend} signals={signals}/></section>
}
