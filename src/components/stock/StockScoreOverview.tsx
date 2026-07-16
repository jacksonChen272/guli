import { Activity, GitBranch, HeartPulse, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { formatConfidence, formatDate, formatDecisionScore, formatSignedChange, formatStockPrice, formatWholeScore } from '../../lib/formatters'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { marketRepository } from '../../services/dataRepository'
import { calculateStockHealth } from '../../services/stockHealthService'
import type { DecisionResult } from '../../types/decision'
import type { CombinedStockData } from '../../types/officialStockData'
import type { StockSnapshotItem } from '../../types/stockSnapshot'
import { DecisionTraceDrawer } from '../decision/DecisionTraceDrawer'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

export function StockScoreOverview({ symbol }: { symbol: string }) {
  const stock = marketRepository.getStock(symbol)
  const universe = marketRepository.getStocks()
  const health = useMemo(() => stock ? calculateStockHealth(stock, universe) : null, [stock, universe])
  const [decision, setDecision] = useState<DecisionResult | null>(null)
  const [snapshot, setSnapshot] = useState<StockSnapshotItem | null>(null)
  const [combined, setCombined] = useState<CombinedStockData | null>(null)
  const [traceOpen, setTraceOpen] = useState(false)
  useEffect(() => {
    let active = true
    Promise.all([repositoryHub.decisions.getStockDecision(symbol), repositoryHub.stockSnapshots.getBySymbol(symbol), repositoryHub.stocks.getCombinedStock(symbol)]).then(([decisionResult, snapshotResult, combinedResult]) => { if (active) { setDecision(decisionResult); setSnapshot(snapshotResult); setCombined(combinedResult) } }).catch(() => undefined)
    return () => { active = false }
  }, [symbol])
  if (!stock || !health) return null
  const official = combined?.quote
  const price = official?.close ?? stock.price
  const change = official?.change ?? stock.change
  const previous = official?.close !== null && official?.close !== undefined && official.change !== null ? official.close - official.change : null
  const changePercent = previous && change !== null ? change / previous * 100 : stock.changePercent
  const up = changePercent >= 0
  return <>
    <Card className="border-brand-400/15" eyebrow="STOCK SCORE OVERVIEW" action={<div className="flex flex-wrap gap-2"><Badge tone="brand">{stock.industry}</Badge><Badge tone={official ? 'info' : 'warning'}>{official ? '官方 TWSE' : 'Mock fallback'}</Badge></div>}>
      <span className="sr-only">Decision Score、健康分數與單日 Snapshot</span>
      <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[.85fr_2.15fr] xl:items-center">
        <div><p className="mono text-sm text-brand-300">{stock.symbol}</p><h1 className="mt-1 text-[28px] font-semibold tracking-tight text-white sm:text-[34px]">{official?.name ?? stock.name}</h1><p className="mono metric-large mt-4 font-semibold text-white">{formatStockPrice(price)}</p><p className={`mono mt-2 inline-flex items-center gap-2 text-base font-medium ${up ? 'text-red-300' : 'text-emerald-300'}`}>{up ? '上漲 ↑' : '下跌 ↓'} {formatSignedChange(change)}（{formatSignedChange(changePercent, '%')}）</p></div>
        {!decision || !snapshot ? <LoadingState rows={3} /> : <div className="grid gap-4 md:grid-cols-3">
          <Score label="GULI Decision" value={formatDecisionScore(decision.score)} status={decision.label} confidence={`Confidence ${formatConfidence(decision.confidence)}`} purpose="整合市場、產業與個股條件的決策評估。" source="Decision Repository" updated={formatDate(decision.tradeDate)} icon={<ShieldCheck size={19} />} />
          <Score label="健康分數" value={formatWholeScore(health.totalScore)} status={health.grade} purpose="六項健康因子依固定權重計算。" source="Derived／Mock 因子" updated={formatDate(decision.tradeDate)} icon={<HeartPulse size={19} />} />
          <Score label="單日 Snapshot" value={formatWholeScore(snapshot.snapshotScore)} status={snapshot.status} purpose="反映最近交易日價格、流動性與風險狀態。" source="TWSE／Derived" updated={formatDate(snapshot.tradeDate)} icon={<Activity size={19} />} />
        </div>}
      </div>
      {decision && <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-sm leading-6 text-slate-400">三種分數用途不同、分開計算；Decision Trace 可查看本次決策的每項因子與來源。</p><Button variant="primary" onClick={() => setTraceOpen(true)} icon={<GitBranch size={18} />}>查看 Decision Trace</Button></div>}
    </Card>
    <DecisionTraceDrawer decision={decision} open={traceOpen} onClose={() => setTraceOpen(false)} />
  </>
}

function Score({ label, value, status, confidence, purpose, source, updated, icon }: { label: string; value: string; status: string; confidence?: string; purpose: string; source: string; updated: string; icon: React.ReactNode }) { return <div className="rounded-2xl border border-white/[.07] bg-white/[.02] p-5"><div className="flex items-center justify-between gap-2 text-sm font-medium text-slate-300"><span className="flex items-center gap-2">{icon}{label}</span><Badge tone="neutral">{status}</Badge></div><p className="mono mt-4 text-[32px] font-semibold leading-none text-white">{value}</p>{confidence && <p className="mt-2 text-sm text-brand-300">{confidence}</p>}<p className="mt-3 text-sm leading-6 text-slate-400">{purpose}</p><p className="mt-3 border-t border-white/[.05] pt-3 text-xs text-slate-500">來源：{source} · 更新：{updated}</p></div> }
