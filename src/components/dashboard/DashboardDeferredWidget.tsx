import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { DashboardSkeleton } from './DashboardSkeleton'

export function DashboardDeferredWidget({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    if (ready || !containerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setReady(true)
        observer.disconnect()
      },
      { rootMargin: '480px 0px' },
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [ready])

  return (
    <div
      ref={containerRef}
      className="min-h-48 min-w-0"
      data-deferred-widget
      data-loaded={ready ? 'true' : 'false'}
    >
      {ready
        ? <Suspense fallback={<DashboardSkeleton rows={3} />}>{children}</Suspense>
        : <DashboardSkeleton rows={3} />}
    </div>
  )
}
