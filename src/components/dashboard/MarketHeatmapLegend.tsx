import type { HeatmapColorMetric } from '../../types/marketHeatmap'

export function MarketHeatmapLegend({ metric }: { metric: HeatmapColorMetric }) {
  const score = metric !== 'changePercent'
  const title = metric === 'changePercent' ? '漲跌幅' : metric === 'technicalScore' ? 'Technical Score' : 'Decision Score'

  return (
    <div className="heatmap-legend flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500" aria-label="熱力圖圖例">
      <span className="mr-1 font-medium text-slate-300">{title}</span>
      <Legend tone="high" label="High" detail={score ? '高分' : '上漲'} />
      <Legend tone="medium" label="Medium" detail={score ? '中性' : '平盤附近'} />
      <Legend tone="low" label="Low" detail={score ? '低分' : '下跌'} />
      <span className="w-full text-[11px] text-slate-600 sm:w-auto sm:pl-1">台股紅漲、綠跌；文字數值同步呈現。</span>
    </div>
  )
}

function Legend({
  tone,
  label,
  detail,
}: {
  tone: 'high' | 'medium' | 'low'
  label: string
  detail: string
}) {
  return (
    <span className={`heatmap-legend__item heatmap-legend__item--${tone}`}>
      <span className="heatmap-legend__swatch" aria-hidden="true" />
      <strong>{label}</strong>
      <span>{detail}</span>
    </span>
  )
}
