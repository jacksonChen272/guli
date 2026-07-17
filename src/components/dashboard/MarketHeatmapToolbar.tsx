import { ArrowUpToLine } from 'lucide-react'
import type { HeatmapColorMetric, HeatmapSizingMetric } from '../../types/marketHeatmap'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

export type HeatmapDisplayMode = 'industry' | 'stock'

export function MarketHeatmapToolbar({ mode, sizingMetric, colorMetric, industryName, onModeChange, onSizingChange, onColorChange, onBack }: {
  mode: HeatmapDisplayMode
  sizingMetric: HeatmapSizingMetric
  colorMetric: HeatmapColorMetric
  industryName: string | null
  onModeChange: (value: HeatmapDisplayMode) => void
  onSizingChange: (value: HeatmapSizingMetric) => void
  onColorChange: (value: HeatmapColorMetric) => void
  onBack: () => void
}) {
  return <div className="flex min-w-0 flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-5">
    <Control label="顯示模式"><Select aria-label="熱力圖顯示模式" value={mode} onChange={(event) => onModeChange(event.target.value as HeatmapDisplayMode)}><option value="industry">產業</option><option value="stock">個股</option></Select></Control>
    <Control label="面積依據"><Select aria-label="熱力圖面積依據" value={sizingMetric} onChange={(event) => onSizingChange(event.target.value as HeatmapSizingMetric)}><option value="tradingAmount">成交金額</option><option value="tradingVolume">成交量</option></Select></Control>
    <Control label="顏色依據"><Select aria-label="熱力圖顏色依據" value={colorMetric} onChange={(event) => onColorChange(event.target.value as HeatmapColorMetric)}><option value="changePercent">漲跌幅</option><option value="technicalScore">Technical Score</option><option value="decisionScore">Decision Score</option></Select></Control>
    {industryName && <Button className="sm:ml-auto" variant="ghost" onClick={onBack} icon={<ArrowUpToLine size={16}/>}>返回產業層</Button>}
  </div>
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="min-w-0 flex-1 sm:max-w-48"><p className="mb-1.5 text-xs text-slate-500">{label}</p>{children}</div>
}
