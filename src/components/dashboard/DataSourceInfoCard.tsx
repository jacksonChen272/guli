import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  Database,
  HardDrive,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { formulaVersion } from '../../config/decisionFormula'
import { formatDate, formatDateTime } from '../../lib/formatters'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type {
  DataPlatformStatus,
  IndustryPlatformState,
  MarketPlatformState,
  OfficialDatasetPlatformState,
} from '../../types/dataPlatformStatus'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

type DisplayState = MarketPlatformState | OfficialDatasetPlatformState | IndustryPlatformState

export function DataSourceInfoCard({ onReload }: { onReload?: () => void }) {
  const [status, setStatus] = useState<DataPlatformStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatus = useCallback(async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const next = await repositoryHub.getPlatformDataStatus(force)
      setStatus(next)
      return next
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '資料平台狀態讀取失敗')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    void repositoryHub.getPlatformDataStatus().then((next) => {
      if (active) setStatus(next)
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : '資料平台狀態讀取失敗')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  const reload = async () => {
    const next = await loadStatus(true)
    if (next) onReload?.()
  }

  const switchToTwse = async () => {
    if (!repositoryHub.selectProvider('twse')) {
      setError('目前無法啟用 TWSE Provider，請稍後再試。')
      return
    }
    const next = await loadStatus(true)
    if (next) onReload?.()
  }

  const datasets = status ? [
    { label: '市場', value: status.market, note: formatDate(status.marketTradeDate) },
    { label: '個股', value: status.stocks, note: formatDate(status.stockTradeDate) },
    { label: '法人', value: status.institutions, note: formatDate(status.institutionalTradeDate) },
    { label: '產業', value: status.industry, note: status.industry === 'Derived' ? '規則推導' : '模擬資料' },
  ] satisfies Array<{ label: string; value: DisplayState; note: string }> : []

  return (
    <Card
      eyebrow="DATA PLATFORM"
      title="資料可信度狀態"
      variant="compact"
      action={(
        <Button
          size="sm"
          variant="ghost"
          disabled={loading}
          onClick={() => void reload()}
          icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''}/>}>
          重新讀取
        </Button>
      )}>
      <div className="border-t border-[var(--border-subtle)] px-4 py-3 sm:px-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={17} className="mt-0.5 shrink-0 text-brand-300"/>
          <div className="min-w-0">
            <p className="text-sm leading-6 text-slate-200">
              {status?.summary ?? (loading ? '正在驗證 TWSE 靜態資料…' : '尚未取得資料可信度狀態。')}
            </p>
            {status?.migrationNotice && (
              <p className="mt-1 text-xs leading-5 text-sky-200">{status.migrationNotice}</p>
            )}
          </div>
        </div>
      </div>

      {status && (
        <>
          <div className="grid grid-cols-2 gap-px bg-[var(--border-subtle)] lg:grid-cols-4">
            {datasets.map((dataset) => (
              <DatasetStatus key={dataset.label} {...dataset}/>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-px border-t border-[var(--border-subtle)] bg-[var(--border-subtle)] lg:grid-cols-4">
            <MetaItem icon={<Database size={14}/>} label="Provider" value={status.providerLabel}/>
            <MetaItem icon={<CalendarDays size={14}/>} label="市場交易日" value={formatDate(status.marketTradeDate)}/>
            <MetaItem icon={<Clock3 size={14}/>} label="最後更新" value={formatDateTime(status.updatedAt)}/>
            <MetaItem icon={<HardDrive size={14}/>} label="Cache" value={status.cache}/>
          </div>
        </>
      )}

      {status?.canSwitchToTwse && (
        <div className="flex flex-col gap-3 border-t border-amber-300/15 bg-amber-300/[.035] px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="flex items-start gap-2 text-sm leading-6 text-amber-100/90">
            <AlertTriangle size={16} className="mt-1 shrink-0"/>
            目前保留的是本版本中明確選擇的 Mock 模式；官方 JSON 可用時建議切換至 TWSE。
          </p>
          <Button className="min-h-11 shrink-0" onClick={() => void switchToTwse()} disabled={loading}>
            切換至 TWSE 官方資料
          </Button>
        </div>
      )}

      {error && (
        <p role="alert" className="border-t border-red-400/15 px-4 py-3 text-sm text-red-200 sm:px-5">
          {error}；網站會保留可用資料，不會中斷頁面。
        </p>
      )}

      {status && (
        <details className="group border-t border-[var(--border-subtle)]">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 text-xs text-slate-500 sm:px-5">
            <span>Decision 公式 {formulaVersion} · Stale 依交易日與驗證結果判定 · {status.allCoreOfficial ? '核心盤後資料皆為官方' : '含部分、缺少或模擬資料'}</span>
            <span className={status.warnings.length ? 'text-amber-200/80' : 'text-slate-500'}>
              {status.warnings.length ? `${status.warnings.length} 項提醒` : '無驗證提醒'}
            </span>
          </summary>
          <div className="border-t border-[var(--border-subtle)] px-4 py-3 text-sm leading-6 text-amber-100/80 sm:px-5">
            {status.warnings.length
              ? status.warnings.map((warning) => <p key={warning}>• {warning}</p>)
              : <p className="text-slate-500">行情來源與分析推導已分開標示；本平台內容不構成投資建議。</p>}
          </div>
        </details>
      )}
    </Card>
  )
}

function DatasetStatus({ label, value, note }: { label: string; value: DisplayState; note: string }) {
  const style = value === 'Official'
    ? 'border-sky-300/20 bg-sky-300/10 text-sky-100'
    : value === 'Derived'
      ? 'border-violet-300/20 bg-violet-300/10 text-violet-100'
      : value === 'Partial'
        ? 'border-amber-300/20 bg-amber-300/10 text-amber-100'
        : value === 'Missing'
          ? 'border-red-300/20 bg-red-300/10 text-red-100'
          : 'border-slate-300/15 bg-slate-300/[.06] text-slate-200'

  return (
    <div className="min-w-0 bg-[var(--bg-card)] px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{label}</p>
        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style}`}>{value}</span>
      </div>
      <p className="mt-2 truncate text-sm font-medium text-slate-200" title={note}>{note}</p>
    </div>
  )
}

function MetaItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="min-w-0 bg-[var(--bg-card)] px-4 py-3">
      <p className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</p>
      <p className="mt-1.5 truncate text-sm font-medium text-slate-200" title={value}>{value}</p>
    </div>
  )
}
