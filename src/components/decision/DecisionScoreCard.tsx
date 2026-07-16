import { ChevronRight, GitBranch } from 'lucide-react'
import { useState } from 'react'
import type { DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DecisionConfidenceBadge } from './DecisionConfidenceBadge'
import { DecisionTraceDrawer } from './DecisionTraceDrawer'

export function DecisionScoreCard({ decision, compact = false }: { decision: DecisionResult; compact?: boolean }) {
  const [trace, setTrace] = useState(false)
  const tone = decision.direction === 'bullish' ? 'up' : decision.direction === 'bearish' ? 'down' : 'neutral'
  return <><Card title={decision.entityName} eyebrow="GULI DECISION" action={<div className="flex flex-wrap gap-2"><Badge tone={tone}>{decision.label}</Badge><DecisionConfidenceBadge confidence={decision.confidence} /></div>}><div className={`p-5 sm:p-6 ${compact ? 'grid gap-5 sm:grid-cols-[auto_1fr_auto] sm:items-center' : ''}`}><div><p className="mono metric-large font-semibold text-white">{decision.score?.toFixed(1) ?? '—'}</p><p className="mt-2 text-xs text-slate-500">交易日 {decision.tradeDate}</p></div><div className={compact ? '' : 'mt-5'}><p className="text-base leading-7 text-slate-300">{decision.summary}</p><p className="mt-3 text-xs text-slate-500">{decision.trace.formulaVersion} · {decision.trace.normalizationApplied ? '已套用資料正規化' : '未套用正規化'}</p></div><Button variant="primary" onClick={() => setTrace(true)} icon={<GitBranch size={17} />}>查看 Decision Trace <ChevronRight size={16} /></Button></div></Card><DecisionTraceDrawer decision={decision} open={trace} onClose={() => setTrace(false)} /></>
}
