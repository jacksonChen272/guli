import { Info } from 'lucide-react'
import { useId } from 'react'
import type { MarketScoreViewModel } from '../../services/dashboard/MarketScoreViewModel'
import { Badge } from '../ui/Badge'
import { DashboardCountUpValue } from './DashboardCountUpValue'

const finite = (value: number | null): value is number => value !== null && Number.isFinite(value)

export function MarketSentimentVisual({
  sentiment,
}: {
  sentiment: MarketScoreViewModel['sentiment']
}) {
  const score = finite(sentiment.score) ? Math.max(0, Math.min(100, sentiment.score)) : null
  const tone = score === null ? 'warning' : score >= 60 ? 'up' : score < 40 ? 'down' : 'neutral'
  const gradientId = `sentiment-${useId().replace(/:/g, '')}`
  const progress = score ?? 0

  return (
    <div
      className="market-sentiment-gauge rounded-2xl border border-white/[.07] bg-black/15 p-3.5"
      data-testid="market-sentiment-visual"
    >
      <div className="market-sentiment-gauge__header flex items-start justify-between gap-3">
        <div>
          <p className="dashboard-label">Sentiment</p>
          <p className="mt-0.5 text-sm text-slate-400">市場情緒</p>
        </div>
        <Badge tone={tone}>{sentiment.label}</Badge>
      </div>

      <div
        className="market-sentiment-gauge__dial relative mx-auto mt-1 w-full max-w-[250px]"
        role="meter"
        aria-label={`市場情緒 ${sentiment.label}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score ?? undefined}
        aria-valuetext={score === null ? '尚未取得' : `${score.toFixed(1)} 分，${sentiment.label}`}
      >
        <svg viewBox="0 0 220 124" className="block w-full" aria-hidden="true">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="1">
              <stop offset="0" stopColor="#38b987" />
              <stop offset=".5" stopColor="#e5b34d" />
              <stop offset="1" stopColor="#ef6a78" />
            </linearGradient>
          </defs>
          <path
            d="M 20 108 A 90 90 0 0 1 200 108"
            fill="none"
            stroke="rgba(255,255,255,.07)"
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
          />
          <path
            className="market-sentiment-gauge__progress"
            d="M 20 108 A 90 90 0 0 1 200 108"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="14"
            strokeLinecap="round"
            pathLength="100"
            strokeDasharray={`${progress} 100`}
          />
          {[20, 40, 60, 80].map((mark) => {
            const radians = Math.PI - (Math.PI * mark / 100)
            const x1 = 110 + Math.cos(radians) * 78
            const y1 = 108 - Math.sin(radians) * 78
            const x2 = 110 + Math.cos(radians) * 84
            const y2 = 108 - Math.sin(radians) * 84
            return <line key={mark} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,.22)" strokeWidth="1.5" />
          })}
        </svg>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
          <DashboardCountUpValue
            value={score}
            formatter={(next) => next.toFixed(1)}
            className="dashboard-metric-primary block font-semibold leading-none text-white"
          />
          <span className="mt-1 block text-[11px] text-slate-600">滿分 100</span>
        </div>
      </div>

      <div className="market-sentiment-gauge__meta mt-2 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
        <span>區間 {sentiment.interval}</span>
        <span className="dashboard-updated">資料日 {sentiment.tradeDate ?? '尚未取得'}</span>
      </div>
      <p
        className="market-sentiment-gauge__reason mt-2 flex items-start gap-1.5 text-xs leading-5 text-slate-500"
        title={`${sentiment.reason} · 規則 ${sentiment.formulaVersion}`}
      >
        <Info className="mt-0.5 shrink-0" size={14} strokeWidth={1.8} aria-hidden="true" />
        <span className="line-clamp-2">{sentiment.reason}</span>
      </p>
    </div>
  )
}
