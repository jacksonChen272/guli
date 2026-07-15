import { ArrowRight, GitBranch, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { GubaoDrawer } from '../ai/GubaoDrawer'
import { GubaoMark } from '../brand/Gubao'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

export function GubaoInsight() {
  const [open,setOpen]=useState(false)
  const [observations,setObservations]=useState<string[]>(['正在讀取 DecisionRepository…'])
  useEffect(()=>{let active=true;Promise.all([repositoryHub.decisions.getMarketDecision(),repositoryHub.decisions.getWatchlistDecision()]).then(([market,watchlist])=>{if(active)setObservations([`市場決策 ${market.label}，分數 ${market.score?.toFixed(1)??'—'}，Confidence ${market.confidence}%。`,market.summary,`自選股整體 ${watchlist.label}，分數 ${watchlist.score?.toFixed(1)??'—'}；${watchlist.risks.length} 項主要風險。`])}).catch((cause)=>{if(active)setObservations([cause instanceof Error?cause.message:'DecisionResult 暫時無法讀取。'])});return()=>{active=false}},[])
  return <><Card className="h-full overflow-hidden"><div className="flex items-center gap-3 border-b border-[var(--border-subtle)] p-5"><GubaoMark/><div><p className="eyebrow">GULI Decision Assistant</p><h2 className="mt-1 text-sm font-semibold text-white">股寶決策觀察</h2></div></div><div className="p-5"><div className="space-y-4">{observations.map((item,index)=><div key={`${index}-${item}`} className="flex gap-3"><span className="mono mt-0.5 text-[9px] text-brand-400">0{index+1}</span><p className="text-[11px] leading-5 text-slate-400">{item}</p></div>)}</div><p className="mt-4 flex items-center gap-2 text-[9px] text-slate-600"><GitBranch size={11}/>內容來自 DecisionResult 與 DecisionTrace</p><Button className="mt-5 w-full" onClick={()=>setOpen(true)} icon={<MessageCircle size={14}/>}>詢問股寶 <ArrowRight size={13}/></Button></div></Card><GubaoDrawer open={open} onClose={()=>setOpen(false)}/></>
}
