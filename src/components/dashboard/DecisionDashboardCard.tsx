import { ArrowDownRight, ArrowRight, ArrowUpRight, Gauge, GitBranch, ShieldAlert, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { formatComparison, formatConfidence, formatDecisionScore } from '../../lib/formatters'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { DecisionComparison, DecisionFactor, DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function DecisionDashboardCard() {
  const navigate = useNavigate()
  const [market, setMarket] = useState<DecisionResult | null>(null)
  const [comparison, setComparison] = useState<DecisionComparison | null>(null)
  const [risk, setRisk] = useState(0)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    Promise.all([repositoryHub.decisions.getMarketDecision(), repositoryHub.stockSnapshots.getTopStocks('snapshotScore', 5)]).then(async ([marketDecision, stocks]) => {
      const [marketComparison, decisions] = await Promise.all([
        repositoryHub.decisions.getDecisionComparison('market', marketDecision.entityId, marketDecision.tradeDate).catch(() => null),
        Promise.all(stocks.map((stock) => repositoryHub.decisions.getStockDecision(stock.symbol).catch(() => null))),
      ])
      if (active) {
        setMarket(marketDecision)
        setComparison(marketComparison)
        setRisk(decisions.filter((item) => item?.risks.some((entry) => entry.severity === 'high')).length)
      }
    }).catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : '決策摘要載入失敗') })
    return () => { active = false }
  }, [])
  const positive = factors(market, true)
  const pressure = factors(market, false)
  return <Card title="今日 GULI 決策" eyebrow="DECISION ENGINE v1.0" variant="compact" action={<Button variant="ghost" onClick={() => navigate('/decisions')} icon={<ArrowRight size={16} />}>決策中心</Button>}>
    {error ? <EmptyState title="決策摘要暫時無法顯示" description={error} /> : !market ? <LoadingState rows={3} /> : <>
      <div className="grid gap-px bg-[var(--border-subtle)] sm:grid-cols-2 xl:grid-cols-4">
        <DecisionKpi icon={<Gauge size={17} />} label="市場 Decision Score" value={formatDecisionScore(market.score)} badge={market.label} explanation="整合市場環境與風險的可解釋評估" comparison={comparison?.available ? formatComparison(comparison.scoreChange) : '尚無前期資料'} />
        <DecisionKpi icon={<Target size={17} />} label="市場方向" value={directionLabel(market.direction)} badge={market.direction === 'bullish' ? '偏多' : market.direction === 'bearish' ? '偏空' : '中性'} explanation="依同一 Decision 結果呈現方向，不另行計分" comparison={comparison?.labelChanged ? '較前期狀態改變' : comparison?.available ? '較前期狀態持平' : '尚無前期資料'} />
        <DecisionKpi icon={<GitBranch size={17} />} label="Confidence" value={formatConfidence(market.confidence)} badge="資料可信度" explanation="反映來源完整度、缺值與警示扣分" comparison={comparison?.available ? formatComparison(comparison.confidenceChange, '%') : '尚無前期資料'} />
        <DecisionKpi icon={<ShieldAlert size={17} />} label="高風險候選" value={`${risk}`} badge="需留意" explanation="目前首頁候選中含高嚴重度風險者" comparison="尚無前期資料" />
      </div>
      <div className="grid gap-4 border-t border-[var(--border-subtle)] p-4 lg:grid-cols-2 sm:p-5"><FactorSummary title="正向因子 Top 3" icon={<ArrowUpRight size={17} className="text-red-300" />} items={positive} /><FactorSummary title="壓力因子 Top 3" icon={<ArrowDownRight size={17} className="text-emerald-300" />} items={pressure} /></div>
    </>}
  </Card>
}

function DecisionKpi({ icon, label, value, badge, explanation, comparison }: { icon: React.ReactNode; label: string; value: string; badge: string; explanation: string; comparison: string }) {
  return <div className="bg-[var(--bg-card)] p-4 sm:p-5"><div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 text-sm text-slate-400">{icon}{label}</p><Badge tone="neutral">{badge}</Badge></div><p className="mono mt-3 text-[28px] font-semibold leading-none text-white">{value}</p><p className="mt-3 text-sm leading-5 text-slate-400">{explanation}</p><p className="mt-2 text-xs text-slate-500">前期比較：{comparison}</p></div>
}

function FactorSummary({ title, icon, items }: { title: string; icon: React.ReactNode; items: DecisionFactor[] }) { return <section><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200">{icon}{title}</h3><div className="grid gap-2 sm:grid-cols-3">{items.length ? items.map((item) => <div key={item.code} className="rounded-xl border border-white/[.05] px-3 py-2"><p className="truncate text-sm text-slate-300">{item.name}</p><p className="mono mt-1 text-xs text-slate-500">{signed(item.contribution)} · 權重 {(item.weight * 100).toFixed(0)}%</p></div>) : <p className="text-sm text-slate-500">目前沒有符合條件的因子。</p>}</div></section> }
const factors = (decision: DecisionResult | null, positive: boolean) => decision ? decision.factors.filter((factor) => positive ? (factor.contribution ?? 0) > 0 : (factor.contribution ?? 0) < 0).sort((a, b) => positive ? (b.contribution ?? 0) - (a.contribution ?? 0) : (a.contribution ?? 0) - (b.contribution ?? 0)).slice(0, 3) : []
const signed = (value: number | null) => value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`
const directionLabel = (direction: DecisionResult['direction']) => direction === 'bullish' ? '偏多 ↑' : direction === 'bearish' ? '偏空 ↓' : direction === 'neutral' ? '中性 →' : '資料不足'
