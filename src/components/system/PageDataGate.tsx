import { Database, TriangleAlert } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { repositoryHub } from '../../services/dataRepository'
import type { DataStatus } from '../../types/api'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'
import { PageErrorState } from './PageErrorState'

type Resource = 'overview' | 'stocks' | 'industries' | 'events'
type GateState = { status: DataStatus; source: string; updatedAt: string; warnings: string[]; empty: boolean }
const initial: GateState = { status: 'loading', source: '', updatedAt: '', warnings: [], empty: false }

export function PageDataGate({ resource, children }: { resource: Resource; children: ReactNode }) {
  const [state, setState] = useState<GateState>(initial)
  useEffect(() => { let active = true; const load = async () => { try { const result = resource === 'overview' ? await repositoryHub.market.read(undefined) : resource === 'stocks' ? await repositoryHub.stocks.read(undefined) : resource === 'industries' ? await repositoryHub.industries.read(undefined) : await repositoryHub.market.getEvents(); if (active) setState({ status: result.status, source: result.source, updatedAt: result.updatedAt, warnings: result.warnings, empty: Array.isArray(result.data) && result.data.length === 0 }) } catch { if (active) setState({ ...initial, status: 'error' }) } }; void load(); return () => { active = false } }, [resource])
  if (state.status === 'loading') return <div className="panel"><LoadingState rows={6}/></div>
  if (state.status === 'error') return <PageErrorState description="市場資料暫時無法載入，請重新整理或返回市場總覽。"/>
  if (state.status === 'empty' || state.empty) return <div className="panel"><EmptyState title="目前沒有可顯示的資料" description="請調整條件或稍後再試。"/></div>
  return <><div className={`mb-4 flex flex-col gap-2 rounded-xl border px-4 py-3 text-[10px] sm:flex-row sm:items-center sm:justify-between ${state.status === 'stale' ? 'border-amber-400/15 bg-amber-400/[.035]' : 'border-brand-400/15 bg-brand-400/[.035]'}`}><span className="flex items-center gap-2 text-slate-400">{state.status === 'stale' ? <TriangleAlert size={13} className="text-amber-300"/> : <Database size={13} className="text-brand-300"/>}{state.warnings[0] ?? '資料載入完成'}</span><span className="text-slate-600">來源：{state.source} · 更新：{state.updatedAt} · {state.status === 'stale' ? '可能過期' : '最新'}</span></div>{children}</>
}
