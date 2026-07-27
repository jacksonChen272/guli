import { ChevronDown, Database, RefreshCw } from 'lucide-react'
import { useId, useState } from 'react'
import type { StockDataStatusItem } from '../../services/stock/StockScoreViewModel'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

const tone = (status: StockDataStatusItem['status']) =>
  status === 'official'
    ? 'info'
    : status === 'derived'
      ? 'brand'
      : status === 'missing' || status === 'partial' || status === 'stale'
        ? 'warning'
        : 'neutral'

interface StockDataStatusBarProps {
  items: StockDataStatusItem[]
  stale: boolean
  partial: boolean
  onRetry: () => void
  messages?: string[]
  referenceDate?: string | null
}

export function StockDataStatusBar({
  items,
  stale,
  partial,
  onRetry,
  messages = [],
  referenceDate = null,
}: StockDataStatusBarProps) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const available = items.filter((item) => item.status !== 'missing').length
  const official = items.filter((item) => item.status === 'official').length
  const missing = items.length - available
  const statusItems = items.filter((item) => ['missing', 'partial', 'stale'].includes(item.status))
  const uniqueMessages = [...new Set(messages.filter(Boolean))]
  const alertCount = statusItems.length + uniqueMessages.length
  const overall = partial || missing > 0 ? 'Partial' : stale ? 'Stale' : 'Ready'
  const latestDate = referenceDate
    ?? items.map((item) => item.tradeDate).filter((value): value is string => Boolean(value)).sort().at(-1)
    ?? null

  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="dashboard-card group min-w-0 overflow-hidden"
      data-testid="stock-data-status-bar"
      data-state={overall.toLowerCase()}
    >
      <summary
        className="flex min-h-14 cursor-pointer list-none flex-wrap items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-400 sm:px-5"
        aria-expanded={open}
        aria-controls={panelId}
      >
        <Database size={17} className="shrink-0 text-brand-300" aria-hidden="true" />
        <span className="font-medium text-slate-200">個股資料狀態</span>
        <Badge tone={overall === 'Ready' ? 'brand' : 'warning'}>{overall}</Badge>
        <span className="min-w-0 flex-1 text-xs leading-5 text-slate-500">
          {official} 項官方 · {available} / {items.length} 項可用
          {alertCount ? ` · ${alertCount} 項提醒` : ''}
          {latestDate ? ` · 資料日 ${latestDate}` : ''}
        </span>
        <span className="flex items-center gap-2 text-xs text-slate-400">
          {open ? '收合詳情' : '查看來源與日期'}
          <ChevronDown size={16} className="transition group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </span>
      </summary>

      <div id={panelId} className="border-t border-white/[.06] p-4 sm:p-5">
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <article key={item.id} className="min-w-0 rounded-xl border border-white/[.06] p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-slate-200">{item.label}</p>
                <Badge tone={tone(item.status)}>{item.statusLabel}</Badge>
              </div>
              <p className="mt-2 break-words text-xs leading-5 text-slate-500">{item.detail}</p>
              <p className="mono mt-2 text-[10px] text-slate-600">{item.tradeDate ?? '日期尚未取得'}</p>
            </article>
          ))}
        </div>

        {uniqueMessages.length > 0 && (
          <section className="mt-4 rounded-xl border border-amber-300/10 bg-amber-300/[.025] p-3" aria-label="資料提醒">
            <p className="text-xs font-medium text-amber-200">資料提醒</p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-slate-500">
              {uniqueMessages.map((message) => <li key={message}>• {message}</li>)}
            </ul>
          </section>
        )}

        <div className="mt-4 flex flex-col gap-3 border-t border-white/[.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">
            缺少資料時顯示「尚未取得」，不以 0、NaN 或模擬行情補值。
          </p>
          <Button
            size="sm"
            onClick={onRetry}
            icon={<RefreshCw size={15} aria-hidden="true" />}
          >
            重新讀取
          </Button>
        </div>
      </div>
    </details>
  )
}
