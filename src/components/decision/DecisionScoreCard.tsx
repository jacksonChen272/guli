import { ChevronRight, GitBranch } from 'lucide-react'
import { useState } from 'react'
import type { DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DecisionConfidenceBadge } from './DecisionConfidenceBadge'
import { DecisionTraceDrawer } from './DecisionTraceDrawer'
export function DecisionScoreCard({decision,compact=false}:{decision:DecisionResult;compact?:boolean}){const[trace,setTrace]=useState(false);const tone=decision.direction==='bullish'?'up':decision.direction==='bearish'?'down':'neutral';return <><Card title={decision.entityName} eyebrow="GULI DECISION" action={<div className="flex gap-2"><Badge tone={tone}>{decision.label}</Badge><DecisionConfidenceBadge confidence={decision.confidence}/></div>}><div className={`p-5 ${compact?'grid gap-4 sm:grid-cols-[auto_1fr_auto] sm:items-center':''}`}><div><p className="mono text-4xl font-semibold text-white">{decision.score?.toFixed(1)??'—'}</p><p className="mt-1 text-[9px] text-slate-600">資料日期 {decision.tradeDate}</p></div><div className={compact?'':'mt-4'}><p className="text-sm leading-7 text-slate-300">{decision.summary}</p><p className="mt-2 text-[9px] text-slate-600">{decision.trace.formulaVersion} · {decision.trace.normalizationApplied?'已重新正規化權重':'完整權重'}</p></div><Button size="sm" variant="ghost" onClick={()=>setTrace(true)} icon={<GitBranch size={13}/>}>查看 Decision Trace <ChevronRight size={13}/></Button></div></Card><DecisionTraceDrawer decision={decision} open={trace} onClose={()=>setTrace(false)}/></>}
