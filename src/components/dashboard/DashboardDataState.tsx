import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '../ui/Button'
import { DashboardSkeleton } from './DashboardSkeleton'

export function DashboardDataState({
  loading,
  error,
  empty,
  children,
  onRetry,
  emptyTitle = '目前沒有可顯示的資料',
  emptyDescription = '資料更新完成後會自動顯示。',
  skeleton = 'rows',
}: {
  loading: boolean
  error?: string | null
  empty?: boolean
  children: ReactNode
  onRetry?: () => void
  emptyTitle?: string
  emptyDescription?: string
  skeleton?: 'rows' | 'metrics' | 'heatmap'
}) {
  if (loading) return <DashboardSkeleton variant={skeleton} rows={skeleton === 'metrics' ? 6 : 4} />

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center px-5 py-8 text-center" role="alert">
        <AlertTriangle className="text-amber-300" size={28} aria-hidden="true" />
        <p className="mt-4 font-medium text-slate-200">資料暫時無法讀取</p>
        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{error}</p>
        {onRetry && <Button className="mt-5 min-h-11" onClick={onRetry} icon={<RefreshCw size={16} />}>重新讀取</Button>}
      </div>
    )
  }

  if (empty) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center px-5 py-8 text-center">
        <Inbox className="text-slate-600" size={28} aria-hidden="true" />
        <p className="mt-4 font-medium text-slate-200">{emptyTitle}</p>
        <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{emptyDescription}</p>
        {onRetry && <Button className="mt-5 min-h-11" onClick={onRetry} icon={<RefreshCw size={16} />}>重新讀取</Button>}
      </div>
    )
  }

  return children
}
