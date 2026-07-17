import type { HeatmapColorMetric } from '../../types/marketHeatmap'

export function MarketHeatmapLegend({ metric }: { metric: HeatmapColorMetric }) {
  const score = metric !== 'changePercent'
  return <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500" aria-label="熱力圖圖例">
    <span className="font-medium text-slate-300">{metric === 'changePercent' ? '漲跌幅' : metric === 'technicalScore' ? 'Technical Score' : 'Decision Score'}</span>
    <Legend color="bg-red-400" label={score ? '偏強／高分' : '上漲'}/>
    <Legend color="bg-slate-500" label={score ? '中性或資料不足' : '接近平盤'}/>
    <Legend color="bg-emerald-400" label={score ? '偏弱／低分' : '下跌'}/>
    <span>台股紅漲、綠跌；顏色之外仍保留文字數值。</span>
  </div>
}

function Legend({ color, label }: { color: string; label: string }) { return <span className="inline-flex items-center gap-1.5"><span className={`h-2.5 w-2.5 rounded-sm ${color}`}/>{label}</span> }
