import type { ObservationStatus, WatchlistRiskLevel } from '../types/watchlistDashboard'

export const observationStatusMeta: Record<ObservationStatus, { label: string; description: string; tone: 'neutral' | 'brand' | 'up' | 'down' | 'warning' | 'info'; order: number }> = {
  STRONG: { label: '強勢觀察', description: 'Decision、健康、Snapshot 與 Confidence 同步偏強', tone: 'up', order: 6 },
  ACCUMULATE: { label: '持續累積觀察', description: '決策條件偏正向且風險仍可控', tone: 'brand', order: 5 },
  WATCH: { label: '一般觀察', description: '尚未觸發明確偏強或風險條件', tone: 'neutral', order: 4 },
  RISK: { label: '風險觀察', description: '風險分數或高風險項目偏高', tone: 'warning', order: 3 },
  'SELL WATCH': { label: '轉弱觀察', description: '接近停損參考或 Decision 明顯轉弱', tone: 'down', order: 2 },
  UNKNOWN: { label: '資料不足', description: '缺少必要分數或 Confidence 過低', tone: 'info', order: 1 },
}

export const riskLevelMeta: Record<WatchlistRiskLevel, { label: string; tone: 'up' | 'warning' | 'down' }> = {
  high: { label: '高風險', tone: 'up' },
  medium: { label: '中風險', tone: 'warning' },
  low: { label: '低風險', tone: 'down' },
}
