import { AlertTriangle, CheckCircle2, Clock3, Database, HardDrive, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { HistoryProgressSummary } from '../../types/officialStockHistory'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

const formatNumber = (value: number) => value.toLocaleString('zh-TW')
const formatBytes = (value: number) => value >= 1024 * 1024
  ? `${(value / 1024 / 1024).toFixed(1)} MiB`
  : `${Math.round(value / 1024).toLocaleString('zh-TW')} KiB`
const formatDateTime = (value: string | null) => value
  ? new Intl.DateTimeFormat('zh-TW', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '尚未執行'

export function HistoryProgressCard() {
  const [data, setData] = useState<HistoryProgressSummary | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = (force = false) => {
    setLoading(true)
    setError(null)
    void repositoryHub.historyProgress.get(force)
      .then(setData)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : '無法讀取歷史資料進度'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading && !data) return <Card title="歷史資料回補進度" eyebrow="TWSE OFFICIAL HISTORY" state="loading"><LoadingState rows={4}/></Card>
  if (error && !data) return <Card title="歷史資料回補進度" eyebrow="TWSE OFFICIAL HISTORY" state="error"><div className="space-y-4 p-5"><p className="flex items-start gap-2 text-sm text-amber-200"><AlertTriangle className="mt-0.5 shrink-0" size={18}/>{error}</p><Button onClick={() => load(true)} icon={<RefreshCw size={16}/>}>重新讀取</Button></div></Card>
  if (!data) return null

  const { coverage, lastBatch, capacity } = data
  const statusTone = data.status === 'completed' ? 'brand' : data.status === 'partial' || data.stale ? 'warning' : 'info'
  return <Card
    title="歷史資料回補進度"
    eyebrow="TWSE OFFICIAL HISTORY"
    className="min-w-0 overflow-hidden"
    action={<div className="flex flex-wrap justify-end gap-2"><Badge tone={statusTone}>{data.status.toUpperCase()}</Badge>{data.stale && <Badge tone="warning">資料可能過期</Badge>}</div>}
  >
    <div className="space-y-6 p-5 sm:p-6">
      <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Database size={17}/>} label="可回補普通股" value={formatNumber(coverage.eligibleCommonStocks)}/>
        <Metric icon={<CheckCircle2 size={17}/>} label="完整歷史資料" value={`${formatNumber(coverage.complete)} · ${coverage.completionPercent}%`}/>
        <Metric icon={<RefreshCw size={17}/>} label="待回補" value={`${formatNumber(coverage.pending)} · 約 ${coverage.remainingBatches} 批`}/>
        <Metric icon={<HardDrive size={17}/>} label="可技術分析" value={`${formatNumber(coverage.technicalDataReady)} · ${coverage.analyzablePercent}%`}/>
      </div>

      <ProgressBar label="完整歷史覆蓋率" value={coverage.completionPercent}/>
      <ProgressBar label="技術分析覆蓋率" value={coverage.analyzablePercent} tone="blue"/>

      <div className="grid min-w-0 gap-4 border-t border-white/[.06] pt-5 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-white/[.06] bg-white/[.018] p-4">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">最近批次</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <Value label="計畫" value={lastBatch.planned}/><Value label="完成" value={lastBatch.complete}/><Value label="部分" value={lastBatch.partial}/><Value label="失敗" value={lastBatch.failed}/>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs leading-5 text-slate-500"><Clock3 size={14}/>最後更新 {formatDateTime(data.lastUpdatedAt)}</p>
        </div>
        <div className="min-w-0 rounded-xl border border-white/[.06] bg-white/[.018] p-4">
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-slate-500">容量防護</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm"><Value label="本批增量" value={formatBytes(capacity.batchDeltaBytes)}/><Value label="歷史資料總量" value={formatBytes(capacity.totalHistoryBytes)}/></div>
          <p className={`mt-4 text-xs leading-5 ${capacity.allowPullRequest ? 'text-brand-300' : 'text-amber-300'}`}>{capacity.allowPullRequest ? '容量檢查通過，可建立資料 PR。' : '本批超過 20 MiB，已阻擋資料 PR。'}</p>
        </div>
      </div>

      <p className="text-xs leading-5 text-slate-500">每日最多處理 100 檔；預估仍需 {coverage.estimatedCompletionDays} 個批次日完成目前待處理項目。部分資料不會自動重抓，失敗項目需經人工確認後重試。</p>
    </div>
  </Card>
}

function Metric({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="min-w-0 rounded-xl border border-white/[.06] p-4"><div className="flex items-center gap-2 text-slate-500">{icon}<p className="truncate text-xs">{label}</p></div><p className="mt-2 truncate text-base font-semibold text-white">{value}</p></div>
}

function Value({ label, value }: { label: string; value: string | number }) {
  return <div className="min-w-0"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 truncate font-medium text-slate-100">{value}</p></div>
}

function ProgressBar({ label, value, tone = 'brand' }: { label: string; value: number; tone?: 'brand' | 'blue' }) {
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-xs"><span className="text-slate-400">{label}</span><span className="font-medium text-white">{value.toFixed(1)}%</span></div><div className="h-2 overflow-hidden rounded-full bg-white/[.05]" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className={`h-full rounded-full transition-[width] duration-300 ${tone === 'brand' ? 'bg-brand-400' : 'bg-blue-400'}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }}/></div></div>
}
