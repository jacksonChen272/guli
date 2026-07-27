import { ChevronDown, Database, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useId, useState } from 'react'
import { formatDate, formatDateTime } from '../../lib/formatters'
import type { DataPlatformStatus } from '../../types/dataPlatformStatus'
import type { DataStatus } from '../../types/api'
import { Badge } from '../ui/Badge'

export type DashboardOverallDataStatus = 'Official' | 'Mixed' | 'Partial' | 'Stale' | 'Missing'

export function resolveDashboardOverallStatus(
  platform: DataPlatformStatus | null,
  resourceStatus: DataStatus,
): DashboardOverallDataStatus {
  if (resourceStatus === 'stale') return 'Stale'
  if (!platform) return resourceStatus === 'loading' ? 'Mixed' : 'Missing'
  if (platform.market === 'Missing' && platform.stocks === 'Missing' && platform.institutions === 'Missing') return 'Missing'
  if (platform.stocks === 'Partial' || platform.institutions === 'Partial' || platform.industry === 'Partial') return 'Partial'
  if (platform.allCoreOfficial && platform.industry === 'Official') return 'Official'
  return 'Mixed'
}

const tone = (status: string) => status === 'Official'
  ? 'info'
  : status === 'Missing' || status === 'Mock'
    ? 'warning'
    : 'neutral'

export function DashboardDataStatusBar({
  platform,
  resourceStatus,
  source,
  updatedAt,
  warnings,
  loading = false,
}: {
  platform: DataPlatformStatus | null
  resourceStatus: DataStatus
  source: string
  updatedAt: string
  warnings: string[]
  loading?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const generatedId = useId()
  const detailsId = `dashboard-data-status-${generatedId.replace(/:/g, '')}`
  const overall = resolveDashboardOverallStatus(platform, resourceStatus)
  const alertCount = new Set([...(platform?.warnings ?? []), ...warnings]).size
  const stale = overall === 'Stale'
  const summary = platform?.summary
    ?? (loading ? '正在確認今日資料來源與更新狀態。' : '目前無法取得完整資料來源狀態。')

  return (
    <section
      className={`dashboard-status-bar mb-4 min-w-0 rounded-xl border ${stale ? 'border-amber-400/20 bg-amber-400/[.035]' : 'border-white/[.07] bg-white/[.025]'}`}
      aria-label="Dashboard 資料狀態"
      data-testid="dashboard-data-status-bar"
    >
      <div className="flex min-w-0 flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border ${stale ? 'border-amber-400/20 text-amber-300' : 'border-brand-400/20 text-brand-300'}`}>
            {stale ? <TriangleAlert size={15} aria-hidden="true" /> : <ShieldCheck size={15} aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-slate-300">今日資料可信度</span>
              <Badge tone={tone(overall)}>{overall}</Badge>
              {alertCount > 0 && <Badge tone="warning">{alertCount} 項提醒</Badge>}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{summary}</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-between gap-3 lg:justify-end">
          <span className="truncate text-[11px] text-slate-600">更新 {formatDateTime(updatedAt || platform?.updatedAt)}</span>
          <button
            type="button"
            aria-expanded={expanded}
            aria-controls={detailsId}
            onClick={() => setExpanded((value) => !value)}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-white/[.07] px-3 text-xs text-slate-300 transition hover:border-brand-400/25 hover:text-brand-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60"
          >
            {expanded ? '收合明細' : '查看明細'}
            <ChevronDown className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {expanded && (
        <div id={detailsId} className="border-t border-white/[.06] px-4 py-4">
          <div className="grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <DatasetStatus label="市場" status={platform?.market ?? 'Missing'} date={platform?.marketTradeDate} />
            <DatasetStatus label="個股" status={platform?.stocks ?? 'Missing'} date={platform?.stockTradeDate} />
            <DatasetStatus label="法人" status={platform?.institutions ?? 'Missing'} date={platform?.institutionalTradeDate} />
            <DatasetStatus label="產業" status={platform?.industry ?? 'Missing'} date={platform?.stockTradeDate} />
          </div>
          <div className="mt-3 grid gap-2 text-xs leading-5 text-slate-500 lg:grid-cols-3">
            <p className="flex min-w-0 items-start gap-2"><Database className="mt-0.5 shrink-0" size={13} aria-hidden="true" />來源：{source || platform?.providerLabel || '尚未取得'}</p>
            <p>Cache：{platform?.cache ?? '尚未確認'}</p>
            <p>資料保護：公開測試模式會明確標示推導、模擬、過期與缺少欄位。</p>
          </div>
          {alertCount > 0 && (
            <ul className="mt-3 grid gap-1 text-xs leading-5 text-amber-200/80 sm:grid-cols-2">
              {[...new Set([...(platform?.warnings ?? []), ...warnings])].slice(0, 6).map((warning) => (
                <li key={warning} className="min-w-0 break-words">• {warning}</li>
              ))}
            </ul>
          )}
          {platform?.migrationNotice && <p className="mt-3 text-xs leading-5 text-blue-200/80">{platform.migrationNotice}</p>}
        </div>
      )}
    </section>
  )
}

function DatasetStatus({ label, status, date }: { label: string; status: string; date: string | null | undefined }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[.05] bg-black/10 px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-slate-400">{label}</span>
        <Badge tone={tone(status)}>{status}</Badge>
      </div>
      <p className="mt-2 text-[11px] text-slate-600">資料日 {formatDate(date)}</p>
    </div>
  )
}
