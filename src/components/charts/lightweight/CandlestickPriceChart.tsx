import { useEffect, useRef, useState } from 'react'
import type { CandlestickData, IChartApi, ISeriesApi, LineData, Time } from 'lightweight-charts'
import type { TechnicalIndicatorSeries } from '../../../types/technicalIndicator'
import type { ChartVisibility } from './ChartToolbar'
import { LightweightChartContainer } from './LightweightChartContainer'
import { buildVolumeHistogramData } from './VolumeHistogram'

interface TooltipData { date: string; open: number; high: number; low: number; close: number }

const lineData = (points: Array<{ tradeDate: string; value: number | null }>): LineData<Time>[] => points.flatMap((point) => point.value === null ? [] : [{ time: point.tradeDate as Time, value: point.value }])

export function CandlestickPriceChart({ series, visibility, onMountedChange }: { series: TechnicalIndicatorSeries; visibility: ChartVisibility; onMountedChange?: (mounted: boolean) => void }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container || !series.prices.length) return
    onMountedChange?.(false)
    let active = true
    let chart: IChartApi | null = null
    let resizeObserver: ResizeObserver | null = null
    void import('lightweight-charts').then(({ createChart, CandlestickSeries, HistogramSeries, LineSeries, ColorType, CrosshairMode }) => {
      if (!active) return
      chart = createChart(container, {
        width: container.clientWidth, height: container.clientHeight,
        layout: { background: { type: ColorType.Solid, color: '#0b111d' }, textColor: '#94a3b8', attributionLogo: true },
        grid: { vertLines: { color: 'rgba(148,163,184,.045)' }, horzLines: { color: 'rgba(148,163,184,.045)' } },
        crosshair: { mode: CrosshairMode.Normal },
        rightPriceScale: { borderColor: 'rgba(148,163,184,.12)', scaleMargins: { top: 0.08, bottom: visibility.volume ? 0.24 : 0.08 } },
        timeScale: { borderColor: 'rgba(148,163,184,.12)', timeVisible: true, rightOffset: 2 },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
        handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
      })
      const candle = chart.addSeries(CandlestickSeries, { upColor: '#ef4444', downColor: '#22c55e', borderUpColor: '#ef4444', borderDownColor: '#22c55e', wickUpColor: '#f87171', wickDownColor: '#34d399' })
      candle.setData(series.prices.flatMap((point): CandlestickData<Time>[] => [point.open, point.high, point.low, point.close].some((value) => value === null) ? [] : [{ time: point.tradeDate as Time, open: point.open as number, high: point.high as number, low: point.low as number, close: point.close as number }]))
      const addLine = (points: Array<{ tradeDate: string; value: number | null }>, color: string, width: 1 | 2 = 1, dashed = false): ISeriesApi<'Line'> => {
        const line = chart?.addSeries(LineSeries, { color, lineWidth: width, lineStyle: dashed ? 2 : 0, crosshairMarkerVisible: false, lastValueVisible: false, priceLineVisible: false })
        if (!line) throw new Error('圖表已卸載')
        line.setData(lineData(points))
        return line
      }
      if (visibility.ma5) addLine(series.ma5, '#f59e0b')
      if (visibility.ma20) addLine(series.ma20, '#38bdf8', 2)
      if (visibility.ma60) addLine(series.ma60, '#a78bfa', 2)
      if (visibility.bollinger) {
        addLine(series.bollinger.map((point) => ({ tradeDate: point.tradeDate, value: point.upper })), '#64748b', 1, true)
        addLine(series.bollinger.map((point) => ({ tradeDate: point.tradeDate, value: point.lower })), '#64748b', 1, true)
      }
      if (visibility.volume) {
        const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '', lastValueVisible: false, priceLineVisible: false })
        volume.priceScale().applyOptions({ scaleMargins: { top: 0.78, bottom: 0 } })
        volume.setData(buildVolumeHistogramData(series.prices))
      }
      const crosshairHandler = (parameter: Parameters<Parameters<IChartApi['subscribeCrosshairMove']>[0]>[0]) => {
        if (!parameter.time) { setTooltip(null); return }
        const value = parameter.seriesData.get(candle)
        if (value && 'open' in value) setTooltip({ date: String(parameter.time), open: value.open, high: value.high, low: value.low, close: value.close })
      }
      chart.subscribeCrosshairMove(crosshairHandler)
      chart.timeScale().fitContent()
      resizeObserver = new ResizeObserver((entries) => {
        const entry = entries[0]
        if (entry && chart) chart.resize(Math.max(1, Math.floor(entry.contentRect.width)), Math.max(1, Math.floor(entry.contentRect.height)))
      })
      resizeObserver.observe(container)
      setReady(true)
      onMountedChange?.(true)
    })
    return () => {
      active = false
      resizeObserver?.disconnect()
      chart?.remove()
      chart = null
      onMountedChange?.(false)
    }
  }, [series, visibility, onMountedChange])

  return <LightweightChartContainer ref={containerRef} ariaLabel="TWSE 官方歷史行情 K 線與技術指標">
    {!ready && <div className="absolute inset-0 animate-pulse bg-slate-900/70 motion-reduce:animate-none" aria-label="圖表載入中"/>}
    {tooltip && <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-lg border border-white/10 bg-slate-950/90 px-3 py-2 text-[11px] text-slate-300 shadow-xl"><p className="font-medium text-white">{tooltip.date}</p><p className="mt-1">開 {tooltip.open}　高 {tooltip.high}　低 {tooltip.low}　收 {tooltip.close}</p></div>}
  </LightweightChartContainer>
}

export default CandlestickPriceChart
