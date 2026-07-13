export function LoadingState({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3 p-5" role="status" aria-label="資料載入中">{Array.from({ length: rows }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
}
