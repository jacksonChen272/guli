import ReactECharts from 'echarts-for-react'
import { CalendarDays, Database, Info, Layers3 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { echarts, type EChartsOption } from '../../lib/echarts'
import { resolveHeatmapColor } from '../../services/heatmap/HeatmapColorService'
import { buildIndustryVisualNodes, buildStockVisualNodes } from '../../services/heatmap/HeatmapGroupingService'
import { summarizeHeatmap } from '../../services/heatmap/HeatmapSummaryService'
import type {
  HeatmapColorMetric,
  HeatmapSizingMetric,
  MarketHeatmapDataset,
  MarketHeatmapNode,
} from '../../types/marketHeatmap'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { MarketHeatmapEmptyState } from './MarketHeatmapEmptyState'
import { MarketHeatmapLegend } from './MarketHeatmapLegend'
import { type HeatmapDisplayMode, MarketHeatmapToolbar } from './MarketHeatmapToolbar'
import { formatHeatmapTooltipHtml } from './MarketHeatmapTooltip'

interface ChartDatum {
  id: string
  name: string
  value: number
  node: MarketHeatmapNode
  itemStyle: { color: string }
}

export function MarketHeatmap({
  dataset,
  loading = false,
  error,
  embedded = false,
}: {
  dataset: MarketHeatmapDataset | null
  loading?: boolean
  error?: string | null
  embedded?: boolean
}) {
  const navigate = useNavigate()
  const chartRef = useRef<ReactECharts>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<HeatmapDisplayMode>('industry')
  const [sizingMetric, setSizingMetric] = useState<HeatmapSizingMetric>('tradingAmount')
  const [colorMetric, setColorMetric] = useState<HeatmapColorMetric>('changePercent')
  const [stockLimit, setStockLimit] = useState<50 | 100>(50)
  const [industryId, setIndustryId] = useState<string | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => chartRef.current?.getEchartsInstance().resize())
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const industry = dataset?.industries.find((node) => node.industryId === industryId) ?? null
  const visualNodes = useMemo(() => {
    if (!dataset) return []
    if (mode === 'industry' && !industryId) return buildIndustryVisualNodes(dataset, sizingMetric)
    return buildStockVisualNodes(dataset, sizingMetric, industryId, stockLimit)
  }, [dataset, industryId, mode, sizingMetric, stockLimit])
  const summary = useMemo(() => dataset ? summarizeHeatmap(dataset) : null, [dataset])
  const technicalAvailable = Boolean(dataset?.stocks.some((node) => Number.isFinite(node.technicalScore)))
  const decisionAvailable = Boolean(dataset?.stocks.some((node) => Number.isFinite(node.decisionScore)))

  useEffect(() => {
    if (colorMetric === 'technicalScore' && !technicalAvailable) setColorMetric('changePercent')
    if (colorMetric === 'decisionScore' && !decisionAvailable) setColorMetric('changePercent')
  }, [colorMetric, decisionAvailable, technicalAvailable])

  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 220,
    animationDurationUpdate: 180,
    tooltip: {
      trigger: 'item',
      confine: true,
      appendToBody: false,
      backgroundColor: 'rgba(8,14,17,.97)',
      borderColor: 'rgba(255,255,255,.12)',
      textStyle: { color: '#dbe4e2', fontSize: 12 },
      formatter: (raw: unknown) => {
        const node = (raw as { data?: ChartDatum }).data?.node
        return node ? formatHeatmapTooltipHtml(node, colorMetric) : ''
      },
    },
    series: [{
      type: 'treemap',
      roam: false,
      nodeClick: false,
      breadcrumb: { show: false },
      squareRatio: 1.15,
      visibleMin: 12,
      label: {
        show: true,
        color: '#f8fafc',
        fontSize: 12,
        overflow: 'truncate',
        formatter: (raw: unknown) => {
          const node = (raw as { data?: ChartDatum }).data?.node
          if (!node) return ''
          const percent = node.changePercent === null
            ? '—'
            : `${node.changePercent > 0 ? '+' : ''}${node.changePercent.toFixed(2)}%`
          return `${node.symbol ? `${node.symbol} ` : ''}${node.name}\n${percent}`
        },
      },
      itemStyle: { borderColor: '#0a1114', borderWidth: 2, gapWidth: 2 },
      emphasis: {
        label: { color: '#fff', fontWeight: 'bold' },
        itemStyle: { borderColor: 'rgba(255,255,255,.55)', borderWidth: 2 },
      },
      data: visualNodes.map((item): ChartDatum => ({
        id: item.id,
        name: item.name,
        value: item.value,
        node: item.node,
        itemStyle: { color: resolveHeatmapColor(item.node, colorMetric).color },
      })),
    }],
  }), [colorMetric, visualNodes])

  const events = useMemo(() => ({
    click: (raw: unknown) => {
      const node = (raw as { data?: ChartDatum }).data?.node
      if (!node) return
      if (node.type === 'industry' && node.industryId) navigate(`/industries/${node.industryId}`)
      if (node.type === 'stock' && node.symbol) navigate(`/stock/${node.symbol}`)
    },
  }), [navigate])
  const sourceTone = summary?.sourceLabel === 'Official' ? 'info' : summary?.sourceLabel === 'Mixed' ? 'warning' : 'neutral'

  const content = (
    <>
      <MarketHeatmapToolbar
        mode={mode}
        sizingMetric={sizingMetric}
        colorMetric={colorMetric}
        stockLimit={stockLimit}
        industryName={industry?.name ?? null}
        technicalAvailable={technicalAvailable}
        decisionAvailable={decisionAvailable}
        onModeChange={(value) => {
          setMode(value)
          setIndustryId(null)
        }}
        onSizingChange={setSizingMetric}
        onColorChange={setColorMetric}
        onStockLimitChange={setStockLimit}
        onBack={() => setIndustryId(null)}
      />
      {!dataset || !visualNodes.length ? (
        <MarketHeatmapEmptyState loading={loading} error={error} />
      ) : (
        <div ref={containerRef} className="min-w-0">
          <div className="flex flex-col gap-3 border-b border-white/[.05] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <MarketHeatmapLegend metric={colorMetric} />
            <span className="shrink-0 text-xs text-slate-600">
              {mode === 'stock' || industryId ? `顯示 ${visualNodes.length} 檔個股` : `${visualNodes.length} 個產業群組`}
            </span>
          </div>
          <p className="border-b border-white/[.05] px-4 py-2 text-[11px] leading-5 text-slate-600 sm:px-5">
            面積依{sizingMetric === 'tradingAmount' ? '成交值' : '成交量'}由大到小；顏色依{colorMetric === 'changePercent' ? '漲跌幅' : colorMetric === 'technicalScore' ? ' Technical Score' : ' Decision Score'}。
          </p>
          <div
            role="img"
            aria-label={`${industry?.name ?? (mode === 'industry' ? '產業' : '個股')}市場熱力圖`}
            className="min-w-0 overflow-hidden"
          >
            <ReactECharts
              ref={chartRef}
              echarts={echarts}
              option={option}
              notMerge
              lazyUpdate
              onEvents={events}
              style={{ height: 'clamp(360px, 42vw, 500px)', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>
      )}
      {dataset && (
        <div className="grid gap-3 border-t border-white/[.06] p-4 text-xs text-slate-500 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">
          <p className="flex items-start gap-2"><Database className="mt-0.5 shrink-0" size={14} aria-hidden="true" />普通股 {dataset.totalStockUniverse} 檔；官方分類 {dataset.officialMappedStockCount ?? dataset.mappedStockCount} 檔。</p>
          <p className="flex items-start gap-2"><Layers3 className="mt-0.5 shrink-0" size={14} aria-hidden="true" />官方覆蓋 {(dataset.officialCoverageRate ?? dataset.coverageRate).toFixed(2)}%；衍生群組 {dataset.derivedMappedStockCount ?? 0} 檔。</p>
          <p className="flex items-start gap-2"><Info className="mt-0.5 shrink-0" size={14} aria-hidden="true" />未分類 {dataset.unmappedStockCount} 檔；不依股票名稱猜測產業。</p>
          <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 shrink-0" size={14} aria-hidden="true" />交易日 {dataset.tradeDate}；分類更新 {dataset.mappingEffectiveDate ?? '尚未取得'}。</p>
        </div>
      )}
    </>
  )

  if (embedded) return <div className="min-w-0 overflow-hidden">{content}</div>

  return (
    <section aria-labelledby="market-heatmap-title" className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">盤後市場分布</p>
          <h2 id="market-heatmap-title" className="type-section-title mt-2 font-semibold text-white">市場熱力圖</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">依成交金額呈現市場關注度，顏色代表當日漲跌。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone={sourceTone}>{summary?.sourceLabel ?? 'Missing'}</Badge>
          {dataset && <Badge tone={(dataset.mappingStatus ?? 'Mixed') === 'Official' ? 'info' : 'warning'}>{dataset.mappingStatus ?? 'Mixed'} Mapping</Badge>}
          {dataset?.status === 'stale' && <Badge tone="warning">Stale</Badge>}
        </div>
      </header>
      <Card className="min-w-0 overflow-hidden">{content}</Card>
    </section>
  )
}
