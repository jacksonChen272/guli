import { useEffect, useMemo, useRef, useState } from 'react'
import type { CandlestickData, IChartApi, LineData, Time } from 'lightweight-charts'
import type { PriceZone } from '../../../types/supportResistance'
import type { TechnicalIndicatorSeries } from '../../../types/technicalIndicator'
import type { ChartVisibility } from './ChartToolbar'
import { LightweightChartContainer } from './LightweightChartContainer'
import { buildVolumeHistogramData } from './VolumeHistogram'

interface TooltipData { date: string; open: number; high: number; low: number; close: number; volume: number | null; ma5: number | null; ma20: number | null; ma60: number | null; ma120: number | null }
const lineData = (points: Array<{ tradeDate: string; value: number | null }>): LineData<Time>[] => points.flatMap((point) => point.value === null ? [] : [{ time: point.tradeDate as Time, value: point.value }])
const lineMap = (points: Array<{ tradeDate: string; value: number | null }>) => new Map(points.map((point) => [point.tradeDate, point.value]))

export function CandlestickPriceChart({ series, visibility, zones = [], onMountedChange }: { series: TechnicalIndicatorSeries; visibility: ChartVisibility; zones?: PriceZone[]; onMountedChange?: (mounted: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [ready, setReady] = useState(false)
  const tooltipIndex = useMemo(() => ({ price: new Map(series.prices.map((point) => [point.tradeDate, point])), ma5: lineMap(series.ma5), ma20: lineMap(series.ma20), ma60: lineMap(series.ma60), ma120: lineMap(series.ma120) }), [series])

  useEffect(() => {
    const container = containerRef.current
    if (!container || !series.prices.length) return
    onMountedChange?.(false); setReady(false)
    let active = true
    let chart: IChartApi | null = null
    let resizeObserver: ResizeObserver | null = null
    let crosshairHandler: Parameters<IChartApi['subscribeCrosshairMove']>[0] | null = null
    void import('lightweight-charts').then(({ createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType, CrosshairMode, LineStyle }) => {
      if (!active) return
      chart = createChart(container, { width: container.clientWidth, height: container.clientHeight, layout: { background: { type: ColorType.Solid, color: '#0b111d' }, textColor: '#94a3b8', attributionLogo: true }, grid: { vertLines: { color: 'rgba(148,163,184,.04)' }, horzLines: { color: 'rgba(148,163,184,.04)' } }, crosshair: { mode: CrosshairMode.Normal }, rightPriceScale: { borderColor: 'rgba(148,163,184,.12)', scaleMargins: { top: 0.08, bottom: visibility.volume ? 0.24 : 0.08 } }, timeScale: { borderColor: 'rgba(148,163,184,.12)', timeVisible: true, rightOffset: 2 }, handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false }, handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true } })
      const candle = chart.addSeries(CandlestickSeries, { upColor: '#ef4444', downColor: '#22c55e', borderUpColor: '#ef4444', borderDownColor: '#22c55e', wickUpColor: '#f87171', wickDownColor: '#34d399' })
      candle.setData(series.prices.flatMap((point): CandlestickData<Time>[] => [point.open, point.high, point.low, point.close].some((value) => value === null) ? [] : [{ time: point.tradeDate as Time, open: point.open as number, high: point.high as number, low: point.low as number, close: point.close as number }]))
      const addLine = (points: Array<{ tradeDate: string; value: number | null }>, color: string, width: 1 | 2 = 1, dashed = false) => { const line = chart?.addSeries(LineSeries, { color, lineWidth: width, lineStyle: dashed ? LineStyle.Dashed : LineStyle.Solid, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false }); if (!line) throw new Error('圖表已卸載'); line.setData(lineData(points)) }
      if (visibility.ma5) addLine(series.ma5, '#f59e0b')
      if (visibility.ma20) addLine(series.ma20, '#38bdf8', 2)
      if (visibility.ma60) addLine(series.ma60, '#a78bfa', 2)
      if (visibility.ma120) addLine(series.ma120, '#fb7185', 2)
      if (visibility.bollinger) { addLine(series.bollinger.map((point) => ({ tradeDate: point.tradeDate, value: point.upper })), '#64748b', 1, true); addLine(series.bollinger.map((point) => ({ tradeDate: point.tradeDate, value: point.lower })), '#64748b', 1, true) }
      if (visibility.zones) zones.forEach((zone) => { const color = zone.type === 'support' ? 'rgba(47,197,154,.55)' : 'rgba(239,106,120,.55)'; candle.createPriceLine({ price: zone.center, color, lineWidth: zone.strength === 'strong' ? 2 : 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: zone.type === 'support' ? '支撐' : '壓力' }) })
      if (visibility.volume) { const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '', lastValueVisible: false, priceLineVisible: false }); volume.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } }); volume.setData(buildVolumeHistogramData(series.prices)) }
      crosshairHandler = (parameter) => { if (!parameter.time) { setTooltip(null); return }; const date = String(parameter.time); const value = parameter.seriesData.get(candle); const source = tooltipIndex.price.get(date); if (value && 'open' in value) setTooltip({ date, open: value.open, high: value.high, low: value.low, close: value.close, volume: source?.volume ?? null, ma5: tooltipIndex.ma5.get(date) ?? null, ma20: tooltipIndex.ma20.get(date) ?? null, ma60: tooltipIndex.ma60.get(date) ?? null, ma120: tooltipIndex.ma120.get(date) ?? null }) }
      chart.subscribeCrosshairMove(crosshairHandler)
      chart.timeScale().fitContent()
      resizeObserver = new ResizeObserver((entries) => { const entry = entries[0]; if (entry && chart) chart.resize(Math.max(1, Math.floor(entry.contentRect.width)), Math.max(1, Math.floor(entry.contentRect.height))) })
      resizeObserver.observe(container); setReady(true); onMountedChange?.(true)
    })
    return () => { active = false; resizeObserver?.disconnect(); if (chart && crosshairHandler) chart.unsubscribeCrosshairMove(crosshairHandler); chart?.remove(); chart = null; onMountedChange?.(false) }
  }, [series, visibility, zones, onMountedChange, tooltipIndex])

  const show = (value: number | null) => value === null ? '—' : value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })
  return <LightweightChartContainer ref={containerRef} ariaLabel="TWSE 官方歷史行情 K 線、成交量、均線與支撐壓力區">{!ready && <div className="absolute inset-0 animate-pulse bg-slate-900/70 motion-reduce:animate-none" aria-label="圖表載入中"/>}{tooltip && <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[calc(100%-24px)] rounded-lg border border-white/10 bg-slate-950/95 px-3 py-2 text-[11px] text-slate-300 shadow-xl"><p className="font-medium text-white">{tooltip.date}</p><p className="mt-1">開 {show(tooltip.open)}　高 {show(tooltip.high)}　低 {show(tooltip.low)}　收 {show(tooltip.close)}</p><p className="mt-1 text-slate-500">量 {tooltip.volume?.toLocaleString('zh-TW') ?? '—'} · MA5 {show(tooltip.ma5)} · MA20 {show(tooltip.ma20)} · MA60 {show(tooltip.ma60)} · MA120 {show(tooltip.ma120)}</p></div>}</LightweightChartContainer>
}
export default CandlestickPriceChart
