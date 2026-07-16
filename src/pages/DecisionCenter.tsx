import { Eye, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DecisionMarketOverviewCard } from '../components/decision/DecisionMarketOverviewCard'
import { DecisionRankingSummary } from '../components/decision/DecisionRankingSummary'
import { DecisionTraceDrawer } from '../components/decision/DecisionTraceDrawer'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Select } from '../components/ui/Select'
import { Tabs } from '../components/ui/Tabs'
import { formatConfidence, formatDecisionScore } from '../lib/formatters'
import { repositoryHub } from '../repositories/RepositoryHub'
import type { DecisionComparison, DecisionResult } from '../types/decision'

type Mode = 'industry' | 'stock' | 'watchlist'
const PAGE_SIZE = 25

export function DecisionCenter() {
  const [mode, setMode] = useState<Mode>('industry')
  const [market, setMarket] = useState<DecisionResult | null>(null)
  const [marketComparison, setMarketComparison] = useState<DecisionComparison | null>(null)
  const [watchlist, setWatchlist] = useState<DecisionResult | null>(null)
  const [industries, setIndustries] = useState<DecisionResult[]>([])
  const [stocks, setStocks] = useState<DecisionResult[]>([])
  const [comparisons, setComparisons] = useState<Map<string, DecisionComparison>>(new Map())
  const [query, setQuery] = useState('')
  const [label, setLabel] = useState('all')
  const [confidence, setConfidence] = useState('0')
  const [selected, setSelected] = useState<DecisionResult | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([repositoryHub.decisions.getMarketDecision(), repositoryHub.decisions.getWatchlistDecision(), repositoryHub.industrySnapshots.getLatest(), repositoryHub.stockSnapshots.getLatestIndex()]).then(async ([marketDecision, watchlistDecision, industrySnapshot, stockIndex]) => {
      const [marketDiff, industryRows, stockRows] = await Promise.all([
        repositoryHub.decisions.getDecisionComparison('market', marketDecision.entityId, marketDecision.tradeDate).catch(() => null),
        Promise.all(industrySnapshot.industries.map((item) => repositoryHub.decisions.getIndustryDecision(item.industryId).catch(() => null))),
        Promise.all(stockIndex.records.slice(0, 50).map((item) => repositoryHub.decisions.getStockDecision(item.symbol).catch(() => null))),
      ])
      const validStocks = stockRows.filter((item): item is DecisionResult => item !== null)
      const stockDiffs = await Promise.all(validStocks.map(async (item) => [item.entityId, await repositoryHub.decisions.getDecisionComparison('stock', item.entityId, item.tradeDate).catch(() => null)] as const))
      if (active) {
        setMarket(marketDecision)
        setMarketComparison(marketDiff)
        setWatchlist(watchlistDecision)
        setIndustries(industryRows.filter((item): item is DecisionResult => item !== null))
        setStocks(validStocks)
        setComparisons(new Map(stockDiffs.filter((entry): entry is readonly [string, DecisionComparison] => entry[1] !== null)))
        setWarnings([...industrySnapshot.warnings, ...stockIndex.warnings])
      }
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : '決策中心載入失敗') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])
  const source = mode === 'industry' ? industries : mode === 'stock' ? stocks : watchlist ? [watchlist] : []
  const rows = useMemo(() => source.filter((item) => (!query || item.entityId.includes(query) || item.entityName.includes(query)) && (label === 'all' || item.label === label) && item.confidence >= Number(confidence)).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)), [source, query, label, confidence])
  useEffect(() => setPage(1), [mode, query, label, confidence])
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const stale = warnings.some((warning) => /stale|過期|非最新/i.test(warning))
  return <div className="space-y-8">
    <SectionHeader eyebrow="GULI AI DECISION ENGINE" title="決策中心" description="由固定公式整合官方、衍生、Mock 與缺值資訊；所有分數均可展開 Decision Trace。" action={<div className="flex gap-2"><Badge tone={error ? 'warning' : stale ? 'warning' : warnings.length ? 'info' : 'brand'}>{error ? 'Error' : stale ? 'Stale' : warnings.length ? 'Partial' : 'Success'}</Badge><Badge tone="neutral">50 檔觀察池</Badge></div>} />
    <section aria-label="市場決策">{market ? <DecisionMarketOverviewCard decision={market} comparison={marketComparison} onTrace={() => setSelected(market)} /> : <Card state={error ? 'error' : 'loading'}>{error ? <EmptyState title="市場決策暫時無法顯示" description={error} /> : <LoadingState rows={5} />}</Card>}</section>
    <DecisionRankingSummary decisions={stocks} comparisons={comparisons} loading={loading} error={error} onSelect={setSelected} />
    <Card id="complete-decision-ranking" title="完整決策排行" eyebrow="INDUSTRY · STOCK · WATCHLIST"><div className="border-b border-[var(--border-subtle)] p-5 sm:p-6"><Tabs value={mode} onChange={setMode} options={[{ value: 'industry', label: '產業決策' }, { value: 'stock', label: '個股決策' }, { value: 'watchlist', label: '自選股決策' }]} /><div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_170px]"><label className="relative"><span className="sr-only">搜尋決策</span><Search className="absolute left-3 top-3.5 text-slate-400" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="輸入代號或名稱" className="min-h-11 w-full rounded-xl border border-white/[.08] bg-white/[.02] pl-10 pr-3 text-[15px] text-white outline-none focus:border-brand-400/40" /></label><Select value={label} onChange={(event) => setLabel(event.target.value)} aria-label="決策標籤"><option value="all">全部標籤</option>{['極強', '偏強', '中性', '偏弱', '極弱', '資料不足'].map((value) => <option key={value}>{value}</option>)}</Select><Select value={confidence} onChange={(event) => setConfidence(event.target.value)} aria-label="最低信心"><option value="0">全部信心</option><option value="41">信心 ≥ 41</option><option value="61">信心 ≥ 61</option><option value="81">信心 ≥ 81</option></Select></div></div>
      {loading ? <LoadingState rows={8} /> : error ? <EmptyState title="完整排行暫時無法顯示" description={error} /> : <>
        <div className="hidden md:block"><div className="grid min-h-12 grid-cols-[56px_1.3fr_.7fr_.7fr_.9fr_56px] items-center gap-3 border-b border-white/[.06] px-5 text-sm font-semibold text-slate-400"><span>排名</span><span>標的</span><span className="text-right">Decision</span><span>Label</span><span>Confidence／風險</span><span /></div>{visible.map((item, index) => <button key={item.entityId} onClick={() => setSelected(item)} className="grid min-h-[72px] w-full grid-cols-[56px_1.3fr_.7fr_.7fr_.9fr_56px] items-center gap-3 border-b border-white/[.05] px-5 text-left hover:bg-white/[.025]"><span className="mono text-sm text-slate-500">{(page - 1) * PAGE_SIZE + index + 1}</span><span><span className="block text-base font-medium text-white">{item.entityName}</span><span className="mono mt-1 block text-sm text-slate-500">{item.entityId} · {item.tradeDate}</span></span><span className="mono text-right text-xl font-semibold text-white">{formatDecisionScore(item.score)}</span><span><Badge tone={item.direction === 'bullish' ? 'up' : item.direction === 'bearish' ? 'down' : 'neutral'}>{item.label}</Badge></span><span className="text-sm text-slate-400">Confidence {formatConfidence(item.confidence)} · 風險 {item.risks.length}</span><span className="icon-button grid place-items-center rounded-xl text-brand-300"><Eye size={18} /></span></button>)}</div>
        <div className="space-y-4 p-4 md:hidden">{visible.map((item, index) => <button key={item.entityId} onClick={() => setSelected(item)} className="mobile-data-card block min-h-0 w-full text-left"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">#{(page - 1) * PAGE_SIZE + index + 1}</p><p className="mt-1 text-base font-semibold text-white">{item.entityName}</p><p className="mono mt-1 text-sm text-slate-400">{item.entityId} · {item.tradeDate}</p></div><Badge tone={item.direction === 'bullish' ? 'up' : item.direction === 'bearish' ? 'down' : 'neutral'}>{item.label}</Badge></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/[.025] p-3"><p className="text-xs text-slate-500">Decision Score</p><p className="mono mt-2 text-2xl text-white">{formatDecisionScore(item.score)}</p></div><div className="rounded-xl bg-white/[.025] p-3"><p className="text-xs text-slate-500">Confidence</p><p className="mono mt-2 text-2xl text-white">{formatConfidence(item.confidence)}</p></div></div><p className="mt-3 text-sm text-slate-400">風險 {item.risks.length} 項 · 點擊查看 Decision Trace</p></button>)}</div>
        {!visible.length && <EmptyState title="目前沒有符合篩選條件的決策" description="請調整模式、標籤、信心門檻或搜尋條件。" />}
        <div className="flex items-center justify-between border-t border-white/[.06] p-4 sm:px-6"><Button variant="ghost" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>上一頁</Button><span className="text-sm text-slate-400">第 {page}／{Math.max(1, Math.ceil(rows.length / PAGE_SIZE))} 頁 · 每頁 {PAGE_SIZE} 筆</span><Button variant="ghost" disabled={page * PAGE_SIZE >= rows.length} onClick={() => setPage((value) => value + 1)}>下一頁</Button></div>
      </>}
    </Card>
    {warnings.length > 0 && <details className="panel group"><summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-5 text-sm text-slate-400"><span>資料警示與 Partial 狀態</span><span>{warnings.length} 項</span></summary><div className="border-t border-white/[.06] p-5 text-sm leading-6 text-amber-200/80">{warnings.map((warning) => <p key={warning}>• {warning}</p>)}</div></details>}
    <DecisionTraceDrawer decision={selected} open={selected !== null} onClose={() => setSelected(null)} />
  </div>
}
