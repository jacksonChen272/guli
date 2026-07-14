export function LoadingState({ rows = 3 }: { rows?: number }) {
  return <div className="space-y-3 p-5" role="status" aria-live="polite" aria-label="資料載入中"><span className="sr-only">資料載入中，請稍候。</span>{Array.from({ length: rows }, (_, index) => <div key={index} className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />)}</div>
}
