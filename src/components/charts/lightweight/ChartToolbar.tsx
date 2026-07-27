import type { KeyboardEvent } from 'react'

export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'
export interface ChartVisibility {
  ma5: boolean
  ma20: boolean
  ma60: boolean
  ma120: boolean
  bollinger: boolean
  volume: boolean
  zones: boolean
}

export const historyRangeMinimumRecords: Record<HistoryRange, number> = {
  '1M': 22,
  '3M': 66,
  '6M': 132,
  '1Y': 250,
  ALL: 1,
}

const ranges: HistoryRange[] = ['1M', '3M', '6M', '1Y', 'ALL']
const indicators: Array<[keyof ChartVisibility, string]> = [
  ['ma5', 'MA5'],
  ['ma20', 'MA20'],
  ['ma60', 'MA60'],
  ['ma120', 'MA120'],
  ['bollinger', '布林通道'],
  ['volume', '成交量'],
  ['zones', '支撐壓力區'],
]

export function getAvailableHistoryRanges(recordCount: number): HistoryRange[] {
  const safeCount = Number.isFinite(recordCount) ? Math.max(0, Math.floor(recordCount)) : 0
  return ranges.filter((range) => range === 'ALL' || safeCount >= historyRangeMinimumRecords[range])
}

export function getDefaultHistoryRange(recordCount: number): HistoryRange {
  const available = getAvailableHistoryRanges(recordCount)
  return (['1Y', '6M', '3M', '1M', 'ALL'] as HistoryRange[])
    .find((range) => available.includes(range)) ?? 'ALL'
}

export function ChartToolbar({
  range,
  onRangeChange,
  visibility,
  onVisibilityChange,
  recordCount,
}: {
  range: HistoryRange
  onRangeChange: (range: HistoryRange) => void
  visibility: ChartVisibility
  onVisibilityChange: (next: ChartVisibility) => void
  recordCount: number
}) {
  const availableRanges = getAvailableHistoryRanges(recordCount)
  const keyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    values: HistoryRange[],
    current: HistoryRange,
    select: (value: HistoryRange) => void,
  ) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key) || !values.length) return
    event.preventDefault()
    const currentIndex = Math.max(0, values.indexOf(current))
    const offset = event.key === 'ArrowRight' ? 1 : -1
    const next = (currentIndex + offset + values.length) % values.length
    select(values[next])
  }

  return (
    <div className="flex min-w-0 flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div
          role="tablist"
          aria-label="歷史行情範圍"
          className="flex min-w-0 overflow-x-auto rounded-lg border border-white/[.07] p-1"
          onKeyDown={(event) => keyDown(event, availableRanges, range, onRangeChange)}
        >
          {ranges.map((item) => {
            const enabled = availableRanges.includes(item)
            const minimum = historyRangeMinimumRecords[item]
            return (
              <button
                role="tab"
                aria-selected={range === item}
                aria-disabled={!enabled}
                tabIndex={range === item && enabled ? 0 : -1}
                key={item}
                type="button"
                disabled={!enabled}
                title={enabled ? `顯示 ${item === 'ALL' ? '全部' : item} 歷史` : `至少需要 ${minimum} 個交易日`}
                onClick={() => enabled && onRangeChange(item)}
                className={`min-h-11 min-w-12 rounded-md px-3 text-xs transition-colors motion-reduce:transition-none ${
                  range === item
                    ? 'bg-brand-400/15 text-brand-200'
                    : enabled
                      ? 'text-slate-500 hover:text-slate-200'
                      : 'cursor-not-allowed text-slate-700'
                }`}
              >
                {item === 'ALL' ? '全部' : item}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[10px] leading-4 text-slate-600">
          可用 {Math.max(0, recordCount)} 個交易日；樣本不足的期間已停用。
        </p>
      </div>

      <div className="flex min-w-0 gap-2 overflow-x-auto" aria-label="技術指標顯示切換">
        {indicators.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={visibility[key]}
            onClick={() => onVisibilityChange({ ...visibility, [key]: !visibility[key] })}
            className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs transition-colors motion-reduce:transition-none ${
              visibility[key]
                ? 'border-brand-400/25 bg-brand-400/[.08] text-brand-200'
                : 'border-white/[.07] text-slate-500 hover:text-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
