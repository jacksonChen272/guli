export function DashboardSkeleton({
  rows = 3,
  variant = 'rows',
}: {
  rows?: number
  variant?: 'rows' | 'metrics' | 'heatmap'
}) {
  const label = variant === 'heatmap' ? '市場熱力圖載入中' : '資料載入中'

  if (variant === 'metrics') {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 sm:p-5" role="status" aria-label={label}>
        <span className="sr-only">資料載入中，請稍候。</span>
        {Array.from({ length: rows }, (_, index) => (
          <span key={index} className="h-24 animate-pulse rounded-2xl bg-white/[.04]" aria-hidden="true" />
        ))}
      </div>
    )
  }

  if (variant === 'heatmap') {
    return (
      <div className="space-y-3 p-4 sm:p-5" role="status" aria-label={label}>
        <span className="sr-only">市場熱力圖載入中，請稍候。</span>
        <span className="block h-12 animate-pulse rounded-xl bg-white/[.04]" aria-hidden="true" />
        <span className="block h-[360px] animate-pulse rounded-2xl bg-white/[.035]" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4 sm:p-5" role="status" aria-label={label}>
      <span className="sr-only">資料載入中，請稍候。</span>
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className="block h-12 animate-pulse rounded-xl bg-white/[.04]" aria-hidden="true" />
      ))}
    </div>
  )
}
