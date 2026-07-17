export type HistoryRange = '1M' | '3M' | '6M' | '1Y' | 'ALL'
export interface ChartVisibility { ma5: boolean; ma20: boolean; ma60: boolean; bollinger: boolean; volume: boolean }

const ranges: HistoryRange[] = ['1M', '3M', '6M', '1Y', 'ALL']
const indicators: Array<[keyof ChartVisibility, string]> = [['ma5', 'MA5'], ['ma20', 'MA20'], ['ma60', 'MA60'], ['bollinger', '布林通道'], ['volume', '成交量']]

export function ChartToolbar({ range, onRangeChange, visibility, onVisibilityChange }: { range: HistoryRange; onRangeChange: (range: HistoryRange) => void; visibility: ChartVisibility; onVisibilityChange: (next: ChartVisibility) => void }) {
  const keyDown = (event: React.KeyboardEvent<HTMLDivElement>, values: string[], current: string, select: (value: string) => void) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return
    event.preventDefault()
    const offset = event.key === 'ArrowRight' ? 1 : -1
    const next = (values.indexOf(current) + offset + values.length) % values.length
    select(values[next])
  }
  return <div className="flex flex-col gap-3 border-b border-white/[.06] p-4 sm:flex-row sm:items-center sm:justify-between">
    <div role="tablist" aria-label="歷史行情期間" className="flex min-w-0 overflow-x-auto rounded-lg border border-white/[.07] p-1" onKeyDown={(event) => keyDown(event, ranges, range, (value) => onRangeChange(value as HistoryRange))}>
      {ranges.map((item) => <button role="tab" aria-selected={range === item} tabIndex={range === item ? 0 : -1} key={item} type="button" onClick={() => onRangeChange(item)} className={`min-h-11 min-w-12 rounded-md px-3 text-xs transition-colors ${range === item ? 'bg-brand-400/15 text-brand-200' : 'text-slate-500 hover:text-slate-200'}`}>{item === 'ALL' ? '全部' : item}</button>)}
    </div>
    <div className="flex min-w-0 gap-2 overflow-x-auto" aria-label="技術指標顯示選項">
      {indicators.map(([key, label]) => <button key={key} type="button" aria-pressed={visibility[key]} onClick={() => onVisibilityChange({ ...visibility, [key]: !visibility[key] })} className={`min-h-11 shrink-0 rounded-lg border px-3 text-xs transition-colors ${visibility[key] ? 'border-brand-400/25 bg-brand-400/[.08] text-brand-200' : 'border-white/[.07] text-slate-500 hover:text-slate-200'}`}>{label}</button>)}
    </div>
  </div>
}

