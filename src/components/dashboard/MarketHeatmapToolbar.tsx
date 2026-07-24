import { ArrowUpToLine } from 'lucide-react'
import type { HeatmapColorMetric, HeatmapSizingMetric } from '../../types/marketHeatmap'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

export type HeatmapDisplayMode = 'industry' | 'stock'

export function MarketHeatmapToolbar({
  mode,
  sizingMetric,
  colorMetric,
  stockLimit,
  industryName,
  technicalAvailable,
  decisionAvailable,
  onModeChange,
  onSizingChange,
  onColorChange,
  onStockLimitChange,
  onBack,
}: {
  mode: HeatmapDisplayMode
  sizingMetric: HeatmapSizingMetric
  colorMetric: HeatmapColorMetric
  stockLimit: 50 | 100
  industryName: string | null
  technicalAvailable: boolean
  decisionAvailable: boolean
  onModeChange: (value: HeatmapDisplayMode) => void
  onSizingChange: (value: HeatmapSizingMetric) => void
  onColorChange: (value: HeatmapColorMetric) => void
  onStockLimitChange: (value: 50 | 100) => void
  onBack: () => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-white/[.06] p-3 sm:flex-row sm:flex-wrap sm:items-end sm:p-4">
      <Control label="顯示模式">
        <Select aria-label="熱力圖顯示模式" value={mode} onChange={(event) => onModeChange(event.target.value as HeatmapDisplayMode)}>
          <option value="industry">產業</option>
          <option value="stock">個股</option>
        </Select>
      </Control>
      <Control label="面積依據">
        <Select aria-label="熱力圖面積依據" value={sizingMetric} onChange={(event) => onSizingChange(event.target.value as HeatmapSizingMetric)}>
          <option value="tradingAmount">成交值</option>
          <option value="tradingVolume">成交量</option>
        </Select>
      </Control>
      <Control label="顏色依據">
        <Select aria-label="熱力圖顏色依據" value={colorMetric} onChange={(event) => onColorChange(event.target.value as HeatmapColorMetric)}>
          <option value="changePercent">漲跌幅</option>
          <option value="technicalScore" disabled={!technicalAvailable}>Technical Score{technicalAvailable ? '' : '（資料不足）'}</option>
          <option value="decisionScore" disabled={!decisionAvailable}>Decision Score{decisionAvailable ? '' : '（資料不足）'}</option>
        </Select>
      </Control>
      {mode === 'stock' && (
        <Control label="個股範圍">
          <div className="flex rounded-xl border border-white/[.07] p-1" role="group" aria-label="熱力圖個股數量">
            {[50, 100].map((limit) => (
              <button
                key={limit}
                type="button"
                aria-pressed={stockLimit === limit}
                onClick={() => onStockLimitChange(limit as 50 | 100)}
                className={`min-h-11 flex-1 rounded-lg px-3 text-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 ${stockLimit === limit ? 'bg-brand-400/10 text-brand-300' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Top {limit}
              </button>
            ))}
          </div>
        </Control>
      )}
      {industryName && <Button className="sm:ml-auto" variant="ghost" onClick={onBack} icon={<ArrowUpToLine size={16}/>}>返回產業層級</Button>}
      {(!technicalAvailable || !decisionAvailable) && (
        <p className="w-full text-[11px] leading-5 text-slate-600">
          {!technicalAvailable && 'Technical 色彩停用：目前樣本沒有可用技術分數。 '}
          {!decisionAvailable && 'Decision 色彩停用：目前樣本沒有可用決策分數。'}
        </p>
      )}
    </div>
  )
}

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="min-w-0 flex-1 sm:max-w-48"><span className="mb-1.5 block text-xs text-slate-500">{label}</span>{children}</label>
}
