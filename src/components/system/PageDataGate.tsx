import { Database, TriangleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { resourceTrustSources } from '../../services/BetaDataGuard'
import { repositoryHub } from '../../services/dataRepository'
import type { DataStatus } from '../../types/api'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { DataTrustBanner } from './DataTrustBanner'
import { PageErrorState } from './PageErrorState'

type Resource = 'overview' | 'stocks' | 'industries' | 'events'
type GateState = {
  status: DataStatus
  source: string
  updatedAt: string
  warnings: string[]
  empty: boolean
  summary: string
}

const initial: GateState = {
  status: 'loading',
  source: '',
  updatedAt: '',
  warnings: [],
  empty: false,
  summary: '',
}

const resourceSummary = (
  resource: Resource,
  platform: Awaited<ReturnType<typeof repositoryHub.getPlatformDataStatus>>,
) => {
  if (resource === 'overview' || resource === 'events') return platform.summary
  if (resource === 'stocks') {
    return platform.stocks === 'Official'
      ? '個股行情來自 TWSE 官方盤後資料；健康、快照與決策分數為 GULI 規則推導。'
      : `個股行情狀態為 ${platform.stocks}；缺少欄位不會標示為官方完整資料。`
  }
  return platform.industry === 'Derived'
    ? '產業資料目前為 GULI 規則推導，尚未接入官方產業分類盤後資料。'
    : `產業資料狀態為 ${platform.industry}，請依來源 Badge 判讀。`
}

export function PageDataGate({ resource, children }: { resource: Resource; children: ReactNode }) {
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
          })
        }
      } catch {
        if (active) setState({ ...initial, status: 'error' })
      }
    }
    void load()
    return () => { active = false }
  }, [resource])

  if (state.status === 'loading') return <div className="panel"><LoadingState rows={6}/></div>
  if (state.status === 'error') {
    return <PageErrorState description="資料暫時無法載入。請重新整理頁面；已驗證的快取資料不會被覆蓋。"/>
  }
  if (state.status === 'empty' || state.empty) {
    return <div className="panel"><EmptyState title="目前沒有可顯示的資料" description="請稍後重新讀取資料。"/></div>
  }

  return (
    <>
      <DataTrustBanner
        sources={resourceTrustSources(resource)}
        stale={state.status === 'stale'}
        message={state.summary}/>
      <div className={`mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${state.status === 'stale' ? 'border-amber-400/15 bg-amber-400/[.035]' : 'border-brand-400/15 bg-brand-400/[.035]'}`}>
        <span className="flex items-center gap-2 text-slate-400">
          {state.status === 'stale'
            ? <TriangleAlert size={13} className="text-amber-300"/>
            : <Database size={13} className="text-brand-300"/>}
          {state.warnings.length ? `${state.warnings.length} 項資料提醒` : '資料來源與狀態已完成驗證'}
        </span>
        <span className="text-slate-600">
          來源：{state.source} · 更新：{state.updatedAt} · {state.status === 'stale' ? '可能過期' : '已載入'}
        </span>
      </div>
      {children}
    </>
  )
}
