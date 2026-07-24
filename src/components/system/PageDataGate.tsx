import { Database, TriangleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { resourceTrustSources } from '../../services/BetaDataGuard'
import { repositoryHub } from '../../services/dataRepository'
import type { DataStatus } from '../../types/api'
import type { DataPlatformStatus } from '../../types/dataPlatformStatus'
import { DashboardDataStatusBar } from '../dashboard/DashboardDataStatusBar'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { DataTrustBanner } from './DataTrustBanner'
import { PageErrorState } from './PageErrorState'

type Resource = 'overview' | 'stocks' | 'industries' | 'events'
type GateVariant = 'default' | 'dashboard'
type GateState = {
  status: DataStatus
  source: string
  updatedAt: string
  warnings: string[]
  empty: boolean
  summary: string
  platform: DataPlatformStatus | null
}

const initial: GateState = {
  status: 'loading',
  source: '',
  updatedAt: '',
  warnings: [],
  empty: false,
  summary: '',
  platform: null,
}

const resourceSummary = (resource: Resource, platform: DataPlatformStatus) => {
  if (resource === 'overview' || resource === 'events') return platform.summary
  if (resource === 'stocks') {
    return platform.stocks === 'Official'
      ? '股票行情來自 TWSE 官方盤後資料；分析欄位為 GULI 規則推導。'
      : `股票資料狀態為 ${platform.stocks}，缺少欄位會明確標示。`
  }
  return platform.industry === 'Derived'
    ? '產業資料由 GULI 依官方個股行情與既有規則推導。'
    : `產業資料狀態為 ${platform.industry}，請留意資料標示。`
}

export function PageDataGate({
  resource,
  children,
  variant = 'default',
}: {
  resource: Resource
  children: ReactNode
  variant?: GateVariant
}) {
  const [state, setState] = useState<GateState>(initial)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const result = resource === 'overview'
          ? await repositoryHub.market.read(undefined)
          : resource === 'stocks'
            ? await repositoryHub.stocks.read(undefined)
            : resource === 'industries'
              ? await repositoryHub.industries.read(undefined)
              : await repositoryHub.market.getEvents()
        const platform = await repositoryHub.getPlatformDataStatus()
        if (active) {
          setState({
            status: result.status,
            source: result.source,
            updatedAt: result.updatedAt,
            warnings: result.warnings,
            empty: Array.isArray(result.data) && result.data.length === 0,
            summary: resourceSummary(resource, platform),
            platform,
          })
        }
      } catch {
        if (active) setState({ ...initial, status: 'error' })
      }
    }
    void load()
    return () => { active = false }
  }, [resource])

  if (variant === 'dashboard') {
    return (
      <>
        <DashboardDataStatusBar
          platform={state.platform}
          resourceStatus={state.status}
          source={state.source}
          updatedAt={state.updatedAt}
          warnings={state.warnings}
          loading={state.status === 'loading'}
        />
        {children}
      </>
    )
  }

  if (state.status === 'loading') return <div className="panel"><LoadingState rows={6}/></div>
  if (state.status === 'error') {
    return <PageErrorState description="資料讀取發生問題，請稍後重試。"/>
  }
  if (state.status === 'empty' || state.empty) {
    return <div className="panel"><EmptyState title="目前沒有可顯示的資料" description="請稍後重新整理資料。"/></div>
  }

  return (
    <>
      <DataTrustBanner
        sources={resourceTrustSources(resource)}
        stale={state.status === 'stale'}
        message={state.summary}
      />
      <div className={`mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${state.status === 'stale' ? 'border-amber-400/15 bg-amber-400/[.035]' : 'border-brand-400/15 bg-brand-400/[.035]'}`}>
        <span className="flex items-center gap-2 text-slate-400">
          {state.status === 'stale'
            ? <TriangleAlert size={13} className="text-amber-300"/>
            : <Database size={13} className="text-brand-300"/>}
          {state.warnings.length ? `${state.warnings.length} 項資料提醒` : '資料來源與更新狀態已確認'}
        </span>
        <span className="text-slate-600">
          來源 {state.source} · 更新 {state.updatedAt} · {state.status === 'stale' ? '資料可能較舊' : '讀取正常'}
        </span>
      </div>
      {children}
    </>
  )
}
