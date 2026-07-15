import { ArrowDownRight, ArrowUpRight, ShieldAlert } from 'lucide-react'
import { useEffect,useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { DecisionComparison,DecisionResult } from '../../types/decision'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'
import { DecisionComparisonCard } from './DecisionComparisonCard'
import { DecisionScoreCard } from './DecisionScoreCard'

export function StockDecisionPanel({symbol}:{symbol:string}) {
  const [decision,setDecision]=useState<DecisionResult|null>(null)
  const [comparison,setComparison]=useState<DecisionComparison|null>(null)
  const [error,setError]=useState('')
  useEffect(()=>{let active=true;repositoryHub.decisions.getStockDecision(symbol).then((result)=>{if(!active)return;setDecision(result);return repositoryHub.decisions.getDecisionComparison('stock',symbol,result.tradeDate)}).then((result)=>{if(active&&result)setComparison(result)}).catch((cause)=>{if(active)setError(cause instanceof Error?cause.message:'決策資料載入失敗')});return()=>{active=false}},[symbol])
  if(error)return <Card><p className="p-5 text-xs text-amber-200">{error}</p></Card>
  if(!decision)return <Card title="GULI 決策評估" eyebrow="DECISION ENGINE"><LoadingState rows={5}/></Card>
  const positive=[...decision.factors].filter((factor)=>(factor.contribution??0)>0).sort((a,b)=>b.contribution!-a.contribution!).slice(0,3)
  const negative=[...decision.factors].filter((factor)=>(factor.contribution??0)<0).sort((a,b)=>a.contribution!-b.contribution!).slice(0,2)
  return <section className="space-y-4" aria-label="GULI 個股決策評估">
    <div className="rounded-xl border border-brand-400/15 bg-brand-400/[.025] px-4 py-3"><p className="text-[10px] font-semibold tracking-[.16em] text-brand-300">GULI 決策評估 · DECISION ENGINE v1.0</p><p className="mt-1 text-[9px] text-slate-600">Decision Score、既有健康分數與 Stock Snapshot Score 分開計算。</p></div>
    <DecisionScoreCard decision={decision}/>
    <Card title="決策重點" eyebrow="FACTORS & RISKS" action={<Badge tone="info">Confidence {decision.confidence}%</Badge>}><div className="grid gap-5 p-5 lg:grid-cols-2"><div><p className="mb-3 flex items-center gap-2 text-xs text-white"><ArrowUpRight size={14} className="text-red-300"/>正向因子</p><div className="space-y-2">{positive.length?positive.map((factor)=><FactorRow key={factor.code} name={factor.name} contribution={factor.contribution}/>):<p className="text-[10px] text-slate-600">目前沒有正向貢獻因子。</p>}</div>{negative.length>0&&<><p className="mb-3 mt-5 flex items-center gap-2 text-xs text-white"><ArrowDownRight size={14} className="text-emerald-300"/>壓力因子</p><div className="space-y-2">{negative.map((factor)=><FactorRow key={factor.code} name={factor.name} contribution={factor.contribution}/>)}</div></>}</div><div><p className="mb-3 flex items-center gap-2 text-xs text-white"><ShieldAlert size={14} className="text-amber-300"/>主要風險</p><div className="space-y-2">{decision.risks.length?decision.risks.slice(0,3).map((risk)=><div key={risk.code} className="rounded-xl border border-amber-400/15 p-3"><div className="flex justify-between gap-2"><span className="text-[11px] text-white">{risk.title}</span><Badge tone={risk.severity==='high'?'up':'warning'}>{risk.severity}</Badge></div><p className="mt-2 text-[9px] leading-4 text-slate-600">{risk.explanation}</p></div>):<p className="text-[10px] text-slate-600">目前沒有規則型風險。</p>}</div></div></div></Card>
    <DecisionComparisonCard comparison={comparison}/>
  </section>
}

function FactorRow({name,contribution}:{name:string;contribution:number|null}){return <div className="flex min-h-11 items-center justify-between rounded-xl border border-white/[.06] px-3"><span className="text-[11px] text-slate-300">{name}</span><span className={`mono text-[10px] ${(contribution??0)>=0?'text-red-300':'text-emerald-300'}`}>{contribution===null?'—':`${contribution>0?'+':''}${contribution.toFixed(2)}`}</span></div>}
