import { Bell, Building2, Copy, Download, GitCompareArrows, Share2, Star } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import { buildStockHeaderBadges } from '../../services/stock/StockScoreViewModel'
import { DashboardCard } from '../dashboard/DashboardCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { buildStockExportPayload } from './StockAnalysisHero'

const displayNumber = (value: number | null | undefined, digits = 0) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('zh-TW', { maximumFractionDigits: digits })
    : '尚未取得'

const displayPrice = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value)
    ? value.toLocaleString('zh-TW', {
        minimumFractionDigits: value >= 1000 ? 0 : value >= 100 ? 1 : 2,
        maximumFractionDigits: value >= 1000 ? 0 : value >= 100 ? 1 : 2,
      })
    : '尚未取得'

export function StockPageHeader({ symbol, data }: { symbol: string; data: StockAnalysisData }) {
  const navigate = useNavigate()
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const quote = data.quote
  const change = typeof quote?.change === 'number' && Number.isFinite(quote.change) ? quote.change : null
  const previousClose = change !== null && typeof quote?.close === 'number' ? quote.close - change : null
  const changePercent = previousClose && change !== null ? change / previousClose * 100 : null
  const direction = change === null ? 'unknown' : change > 0 ? 'up' : change < 0 ? 'down' : 'flat'
  const fetchedAt = quote?.fetchedAt
    ? new Date(quote.fetchedAt).toLocaleString('zh-TW', { hour12: false })
    : null
  const contextBadges = buildStockHeaderBadges(data)

  const share = async () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL}stock/${symbol}`
    try {
      if (navigator.share) await navigator.share({ title: `${data.name} ${symbol}｜GULI`, url })
      else await navigator.clipboard.writeText(url)
      setShareState('copied')
    } catch {
      setShareState('failed')
    }
    window.setTimeout(() => setShareState('idle'), 1800)
  }

  const exportJson = () => {
    const blob = new Blob(
      [JSON.stringify(buildStockExportPayload(symbol, data), null, 2)],
      { type: 'application/json;charset=utf-8' },
    )
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `guli-${symbol}-analysis.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const scrollToIndustry = () =>
    document.getElementById('stock-industry-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <DashboardCard
      title={`${data.name} ${symbol}`}
      eyebrow="個股研究"
      subtitle={`${data.industryMapping?.industryName ?? data.stock?.industry ?? '產業尚未取得'} · TWSE`}
      updatedAt={quote?.tradeDate ?? data.dateConsistency.referenceDate}
      stale={data.stale}
      className="border-brand-400/20"
      data-testid="stock-page-header"
      action={(
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone={quote ? 'info' : 'warning'}>{quote ? 'TWSE Official' : '行情 Missing'}</Badge>
          <Badge tone={data.status === 'partial' || data.stale ? 'warning' : 'brand'}>
            {data.status === 'partial' ? 'Partial' : data.stale ? 'Stale' : 'Ready'}
          </Badge>
        </div>
      )}
    >
      <div className="grid min-w-0 gap-6 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1.15fr)] xl:items-end">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mono text-sm text-brand-300">{symbol}</span>
            <Badge tone="neutral">上市</Badge>
            {data.industryMapping?.industryName && (
              <Badge tone="brand">
                <Building2 size={13} className="mr-1" aria-hidden="true" />
                {data.industryMapping.industryName}
              </Badge>
            )}
            {contextBadges.map((badge) => (
              <Badge key={badge.id} tone={badge.tone}>{badge.label}</Badge>
            ))}
          </div>

          <div className="mt-4 flex min-w-0 flex-wrap items-end gap-x-5 gap-y-2">
            <p className="mono min-w-0 tabular-nums text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {displayPrice(quote?.close)}
            </p>
            <p className={`inline-flex min-h-8 items-center gap-2 pb-1 text-sm font-semibold ${direction === 'up' ? 'text-red-300' : direction === 'down' ? 'text-emerald-300' : 'text-slate-400'}`}>
              <span aria-hidden="true">{direction === 'up' ? '▲' : direction === 'down' ? '▼' : '●'}</span>
              <span>{direction === 'up' ? '上漲' : direction === 'down' ? '下跌' : direction === 'flat' ? '平盤' : '漲跌尚未取得'}</span>
              {change !== null && (
                <span className="mono tabular-nums">
                  {change > 0 ? '+' : ''}{change.toFixed(2)}
                  （{changePercent === null ? '—' : `${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%`}）
                </span>
              )}
            </p>
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            資料日 {quote?.tradeDate ?? '尚未取得'} · 抓取時間 {fetchedAt ?? '尚未取得'} · 非即時行情
          </p>
        </div>

        <dl className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="開盤" value={displayPrice(quote?.open)} />
          <Metric label="最高" value={displayPrice(quote?.high)} />
          <Metric label="最低" value={displayPrice(quote?.low)} />
          <Metric
            label="成交量"
            value={quote?.tradeVolume === null || quote?.tradeVolume === undefined
              ? '尚未取得'
              : `${displayNumber(quote.tradeVolume / 1000)} 張`}
          />
          <Metric
            label="成交值"
            value={quote?.tradeValue === null || quote?.tradeValue === undefined
              ? '尚未取得'
              : `${displayNumber(quote.tradeValue / 100_000_000, 1)} 億元`}
          />
          <Metric
            label="本益比"
            value={quote?.peRatio === null || quote?.peRatio === undefined
              ? '尚未取得'
              : quote.peRatio.toFixed(2)}
          />
        </dl>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-2 border-t border-white/[.06] p-4 sm:flex sm:flex-wrap sm:px-6">
        <Button
          className="w-full sm:w-auto"
          variant={data.isWatchlisted ? 'secondary' : 'primary'}
          onClick={data.toggleWatchlist}
          icon={<Star size={16} fill={data.isWatchlisted ? 'currentColor' : 'none'} aria-hidden="true" />}
          aria-pressed={data.isWatchlisted}
        >
          {data.isWatchlisted ? '已加入自選' : '加入自選'}
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={() => navigate(`/watchlist?symbol=${symbol}&action=alert`)}
          icon={<Bell size={16} aria-hidden="true" />}
        >
          建立提醒
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={scrollToIndustry}
          icon={<GitCompareArrows size={16} aria-hidden="true" />}
        >
          同業比較
        </Button>
        <Button
          className="w-full sm:w-auto"
          onClick={() => void share()}
          icon={shareState === 'idle' ? <Share2 size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
        >
          {shareState === 'copied' ? '連結已複製' : shareState === 'failed' ? '分享失敗' : '分享'}
        </Button>
        <Button
          className="col-span-2 w-full sm:w-auto"
          variant="ghost"
          onClick={exportJson}
          icon={<Download size={16} aria-hidden="true" />}
        >
          匯出分析
        </Button>
      </div>
    </DashboardCard>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[.06] bg-white/[.018] p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mono mt-2 break-words text-right text-sm tabular-nums text-white">{value}</dd>
    </div>
  )
}
