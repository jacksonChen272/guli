import { Info } from 'lucide-react'
import type { MarketScoreViewModel } from '../../services/dashboard/MarketScoreViewModel'
import { Badge } from '../ui/Badge'

const finite = (value: number | null): value is number => value !== null && Number.isFinite(value)

export function MarketSentimentVisual({
  sentiment,
}: {
  sentiment: MarketScoreViewModel['sentiment']
}) {
  const score = finite(sentiment.score) ? Math.max(0, Math.min(100, sentiment.score)) : null
  const tone = score === null ? 'warning' : score >= 60 ? 'up' : score < 40 ? 'down' : 'neutral'

  return (
    <div className="rounded-xl border border-white/[.06] bg-black/10 p-2.5" data-testid="market-sentiment-visual">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-slate-500">市場情緒分數</p>
          <div className="mt-1 flex items-baseline gap-2">
            <strong className="mono text-xl text-white">{score === null ? '尚未取得' : score.toFixed(1)}</strong>
            {score !== null && <span className="text-xs text-slate-600">/ 100</span>}
          </div>
        </div>
        <Badge tone={tone}>{sentiment.label}</Badge>
      </div>
      <div
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-[linear-gradient(90deg,rgba(52,211,153,.65)_0%,rgba(100,116,139,.55)_50%,rgba(248,113,113,.65)_100%)]"
        role="meter"
        aria-label={`市場情緒 ${sentiment.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score ?? undefined}
      >
        {score !== null && (
          <span
            className="absolute top-1/2 h-3 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_2px_rgba(8,14,17,.9)] transition-[left] duration-200"
            style={{ left: `${score}%` }}
          />
        )}
      </div>
      <div className="mt-1 flex flex-wrap justify-between gap-2 text-[10px] text-slate-600">
        <span>區間 {sentiment.interval}</span>
        <span>資料日 {sentiment.tradeDate ?? '尚未取得'}</span>
      </div>
      <p className="mt-1 flex items-start gap-1.5 text-[11px] leading-4 text-slate-500" title={`${sentiment.reason} · 規則：${sentiment.formulaVersion}`}>
        <Info className="mt-0.5 shrink-0" size={12} aria-hidden="true" />
        <span className="line-clamp-1">{sentiment.reason}</span>
      </p>
    </div>
  )
}
