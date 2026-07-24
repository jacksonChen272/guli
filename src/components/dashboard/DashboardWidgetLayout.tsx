import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { DashboardWidgetId } from '../../types/dashboardIntelligence'

export function mergeVisibleWidgetOrder(
  current: DashboardWidgetId[],
  visible: DashboardWidgetId[],
  excluded: ReadonlySet<DashboardWidgetId>,
) {
  let visibleIndex = 0
  return current.map((id) => excluded.has(id) ? id : visible[visibleIndex++] ?? id)
}

export function DashboardWidgetLayout({
  renderWidget,
  excludedIds = [],
}: {
  renderWidget: (id: DashboardWidgetId) => ReactNode
  excludedIds?: DashboardWidgetId[]
}) {
  const [order, setOrder] = useState<DashboardWidgetId[]>(() => repositoryHub.dashboardLayout.getOrder())
  const [dragged, setDragged] = useState<DashboardWidgetId | null>(null)
  const excluded = useMemo(() => new Set(excludedIds), [excludedIds])
  const visibleOrder = order.filter((id) => !excluded.has(id))
  const persist = (nextVisible: DashboardWidgetId[]) => {
    const completeOrder = mergeVisibleWidgetOrder(order, nextVisible, excluded)
    setOrder(repositoryHub.dashboardLayout.save(completeOrder))
  }
  const move = (id: DashboardWidgetId, direction: -1 | 1) => {
    const current = visibleOrder.indexOf(id)
    const target = current + direction
    if (target < 0 || target >= visibleOrder.length) return
    const next = [...visibleOrder]
    ;[next[current], next[target]] = [next[target], next[current]]
    persist(next)
  }
  const drop = (target: DashboardWidgetId) => {
    if (!dragged || dragged === target) {
      setDragged(null)
      return
    }
    const next = visibleOrder.filter((item) => item !== dragged)
    next.splice(next.indexOf(target), 0, dragged)
    persist(next)
    setDragged(null)
  }
  const span = (id: DashboardWidgetId) =>
    id === 'recent-search' || id === 'watchlist' ? 'lg:col-span-6' : 'lg:col-span-12'

  return (
    <div className="grid min-w-0 grid-cols-1 gap-7 lg:grid-cols-12 lg:gap-9" data-testid="dashboard-widget-layout">
      {visibleOrder.map((id, index) => (
        <section
          key={id}
          data-widget-id={id}
          draggable
          onDragStart={(event) => {
            setDragged(id)
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', id)
          }}
          onDragEnd={() => setDragged(null)}
          onDragOver={(event) => {
            event.preventDefault()
            event.dataTransfer.dropEffect = 'move'
          }}
          onDrop={() => drop(id)}
          className={`group/widget min-w-0 scroll-mt-24 transition duration-200 ${span(id)} ${dragged === id ? 'opacity-45' : 'opacity-100'}`}
        >
          <div className="mb-2 flex min-h-11 items-center justify-end gap-1 text-slate-600 lg:opacity-0 lg:transition-opacity lg:group-hover/widget:opacity-100 lg:focus-within:opacity-100">
            <span className="mr-1 hidden items-center gap-1 text-[10px] uppercase tracking-wider lg:flex"><GripVertical size={14} aria-hidden="true" />拖曳排序</span>
            <button
              type="button"
              onClick={() => move(id, -1)}
              disabled={index === 0}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/[.05] hover:border-brand-400/20 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="將此區塊往上移"
            >
              <ArrowUp size={16} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => move(id, 1)}
              disabled={index === visibleOrder.length - 1}
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/[.05] hover:border-brand-400/20 hover:text-brand-300 disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="將此區塊往下移"
            >
              <ArrowDown size={16} aria-hidden="true" />
            </button>
          </div>
          {renderWidget(id)}
        </section>
      ))}
    </div>
  )
}
