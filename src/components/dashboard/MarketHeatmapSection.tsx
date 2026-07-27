import { lazy, Suspense } from 'react'
import type { MarketHeatmapDataset } from '../../types/marketHeatmap'
import { Badge } from '../ui/Badge'
import { DashboardCard } from './DashboardCard'
import { DashboardDataState } from './DashboardDataState'
import { DashboardSkeleton } from './DashboardSkeleton'

const MarketHeatmap = lazy(() => import('./MarketHeatmap').then((module) => ({ default: module.MarketHeatmap })))

export function MarketHeatmapSection({
  dataset,
  loading,
  error,
  onRetry,
  className = '',
}: {
  dataset: MarketHeatmapDataset | null
  loading: boolean
  error?: string | null
  onRetry?: () => void
  className?: string
}) {
  const stale = dataset?.status === 'stale'
  const state = loading && !dataset
    ? 'loading'
    : error && !dataset
      ? 'error'
      : !dataset
        ? 'empty'
        : stale
          ? 'stale'
          : 'ready'

  return (
    <DashboardCard
      data-testid="market-heatmap-section"
      className={className}
      title="市場熱力圖"
      eyebrow="MARKET HEATMAP"
      subtitle="以成交值觀察市場關注度；切換產業或個股，辨識資金聚焦位置。"
      updatedAt={dataset?.generatedAt}
      stale={stale}
      state={state}
      action={(
        <div className="flex flex-wrap gap-2">
          <Badge tone={dataset?.sourceSummary.official.length ? 'info' : 'warning'}>
            {dataset?.sourceSummary.official.length ? 'TWSE + 規則推導' : '資料待確認'}
          </Badge>
          {dataset && <Badge tone="neutral">{dataset.tradeDate}</Badge>}
        </div>
      )}
    >
      <DashboardDataState
        loading={loading && !dataset}
        error={error && !dataset ? error : null}
        empty={!loading && !dataset}
        onRetry={onRetry}
        skeleton="heatmap"
        emptyTitle="市場熱力圖尚未產生"
        emptyDescription="目前沒有可用的熱力圖資料；其他市場區塊仍可正常使用。"
      >
        {dataset && (
          <Suspense fallback={<DashboardSkeleton variant="heatmap" />}>
            <MarketHeatmap dataset={dataset} embedded />
          </Suspense>
        )}
      </DashboardDataState>
    </DashboardCard>
  )
}
