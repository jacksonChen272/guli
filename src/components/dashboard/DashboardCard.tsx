import { useId, type HTMLAttributes, type ReactNode } from 'react'
import { DashboardSectionHeader } from './DashboardSectionHeader'

export type DashboardCardState = 'ready' | 'loading' | 'empty' | 'error' | 'stale'

export function DashboardCard({ title, eyebrow, subtitle, updatedAt, stale = false, action, state = stale ? 'stale' : 'ready', contentClassName = '', className = '', children, ...props }: HTMLAttributes<HTMLElement> & {
  title: string
  eyebrow?: string
  subtitle?: string
  updatedAt?: string | null
  stale?: boolean
  action?: ReactNode
  state?: DashboardCardState
  contentClassName?: string
}) {
  const generatedId = useId()
  const titleId = `dashboard-card-${generatedId.replace(/:/g, '')}`
  return <section aria-labelledby={titleId} data-dashboard-card data-state={state} className={`dashboard-card dashboard-card-enter min-w-0 overflow-hidden ${className}`} {...props}>
    <DashboardSectionHeader id={titleId} eyebrow={eyebrow} title={title} subtitle={subtitle} updatedAt={updatedAt} stale={stale} action={action}/>
    <div className={`min-w-0 ${contentClassName}`}>{children}</div>
  </section>
}
