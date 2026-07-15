import { GitBranch, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { DecisionResult } from '../../types/decision'
import { Card } from '../ui/Card'

const questions = ['今天市場決策偏多還是偏空？','2330 決策分數與主要原因？','我的自選股決策整體如何？','我的自選股風險最高是哪一檔？','哪些產業決策最強？','哪些個股決策分數最高？','目前資料信心程度如何？'] as const
const traceNote = (decision:DecisionResult) => `公式 ${decision.trace.formulaVersion}；可用權重 ${(decision.trace.availableWeight*100).toFixed(0)}%；${decision.trace.normalizationApplied?'已套用缺值權重正規化':'使用完整權重'}。`
const mainFactor = (decision:DecisionResult) => [...decision.factors].filter((factor)=>factor.contribution!==null).sort((a,b)=>Math.abs(b.contribution!)-Math.abs(a.contribution!))[0]

export function DecisionGubaoPanel() {
  const [selected,setSelected] = useState<string>('')
  const [answer,setAnswer] = useState('請選擇一個問題。回答會直接引用 DecisionRepository 回傳的 DecisionResult 與 DecisionTrace。')
  const [loading,setLoading] = useState(false)
  const ask = async (question:string) => {
    setSelected(question); setLoading(true)
    try {
      if (question.startsWith('今天市場')) {
        const d=await repositoryHub.decisions.getMarketDecision(); setAnswer(`市場決策為「${d.label}」，分數 ${d.score?.toFixed(1)??'資料不足'}，Confidence ${d.confidence}%。${d.summary} ${traceNote(d)}`)
      } else if (question.startsWith('2330')) {
        const d=await repositoryHub.decisions.getStockDecision('2330'); const factor=mainFactor(d); setAnswer(`2330 決策分數 ${d.score?.toFixed(1)??'資料不足'}，標籤「${d.label}」，主要因子是「${factor?.name??'資料不足'}」，貢獻 ${factor?.contribution?.toFixed(2)??'—'}。${traceNote(d)}`)
      } else if (question.includes('整體')) {
        const d=await repositoryHub.decisions.getWatchlistDecision(); setAnswer(`自選股整體分數 ${d.score?.toFixed(1)??'資料不足'}，標籤「${d.label}」，Confidence ${d.confidence}%。${d.summary} ${traceNote(d)}`)
      } else if (question.includes('風險最高')) {
        const symbols=repositoryHub.watchlist.getSnapshot().map((item)=>item.symbol); const loaded=await Promise.all(symbols.map((symbol)=>repositoryHub.decisions.getStockDecision(symbol).catch(()=>null))); const d=loaded.filter((item):item is DecisionResult=>item!==null).sort((a,b)=>b.risks.length-a.risks.length)[0]; setAnswer(d?`${d.entityId} ${d.entityName} 有 ${d.risks.length} 項主要風險；首要風險為「${d.risks[0]?.title??'目前沒有規則型風險'}」。${traceNote(d)}`:'自選股目前沒有可用 DecisionResult。')
      } else if (question.includes('產業')) {
        const latest=await repositoryHub.industrySnapshots.getLatest(); const rows=await Promise.all(latest.industries.map((item)=>repositoryHub.decisions.getIndustryDecision(item.industryId))); rows.sort((a,b)=>(b.score??-1)-(a.score??-1)); const top=rows.slice(0,3); setAnswer(`${top.map((item)=>`${item.entityName} ${item.score?.toFixed(1)??'—'} 分`).join('、')}。最高者 Confidence ${top[0]?.confidence??'—'}%；${top[0]?traceNote(top[0]):''}`)
      } else if (question.includes('個股決策')) {
        const candidates=await repositoryHub.stockSnapshots.getTopStocks('snapshotScore',10); const rows=await Promise.all(candidates.map((item)=>repositoryHub.decisions.getStockDecision(item.symbol))); rows.sort((a,b)=>(b.score??-1)-(a.score??-1)); const top=rows.slice(0,3); setAnswer(`${top.map((item)=>`${item.entityId} ${item.entityName} ${item.score?.toFixed(1)??'—'} 分`).join('、')}。這是 Decision Score 排序，不是 Stock Snapshot Score 排序。${top[0]?traceNote(top[0]):''}`)
      } else {
        const d=await repositoryHub.decisions.getMarketDecision(); const missing=d.factors.filter((factor)=>factor.normalizedScore===null&&factor.weight>0).map((factor)=>factor.name); setAnswer(`目前市場決策 Confidence ${d.confidence}%。資料警告 ${d.warnings.length} 項；缺值因子：${missing.join('、')||'無'}。${traceNote(d)}`)
      }
    } catch (cause) { setAnswer(cause instanceof Error?cause.message:'暫時無法讀取 DecisionResult。') }
    finally { setLoading(false) }
  }
  return <Card title="股寶 Decision 問答" eyebrow="DECISION REPOSITORY · NO AI API"><div className="grid gap-5 p-5 lg:grid-cols-2"><div className="space-y-2">{questions.map((question)=><button key={question} type="button" onClick={()=>void ask(question)} className={`flex min-h-11 w-full items-center gap-2 rounded-xl border px-3 text-left text-[11px] ${selected===question?'border-brand-400/30 bg-brand-400/[.05] text-white':'border-white/[.06] text-slate-400 hover:text-white'}`}><MessageCircle size={13}/>{question}</button>)}</div><div className="min-h-52 rounded-xl border border-white/[.06] bg-white/[.015] p-4"><p className="flex items-center gap-2 text-[9px] text-brand-300"><GitBranch size={12}/>DecisionResult / DecisionTrace</p><p className="mt-3 text-sm leading-7 text-slate-300">{loading?'正在從 DecisionRepository 讀取決策…':answer}</p></div></div></Card>
}
