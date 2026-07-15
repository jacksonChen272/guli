import { Bot, GitBranch, ShieldCheck } from 'lucide-react'
import { DecisionGubaoPanel } from '../components/ai/DecisionGubaoPanel'
import { Card } from '../components/ui/Card'
import { Disclaimer } from '../components/ui/Disclaimer'
import { SectionHeader } from '../components/ui/SectionHeader'

export function GubaoPageWithDecision(){return <div className="space-y-5">
  <SectionHeader eyebrow="GULI DECISION ASSISTANT" title="股寶決策助理" description="直接引用 DecisionResult 與 Decision Trace 回答；使用固定規則，不呼叫生成式 AI。"/>
  <Card><div className="grid gap-3 p-5 sm:grid-cols-3"><Feature icon={<Bot size={16}/>} title="規則型回答" text="回答來自 DecisionRepository，不另外重算市場結論。"/><Feature icon={<GitBranch size={16}/>} title="可追溯依據" text="引用分數、信心、主要因子與風險。"/><Feature icon={<ShieldCheck size={16}/>} title="來源分層" text="官方、衍生、Mock、fallback 與 missing 清楚標示。"/></div></Card>
  <DecisionGubaoPanel/>
  <Disclaimer>股寶提供的是規則型資料解讀，不構成投資建議。</Disclaimer>
</div>}

function Feature({icon,title,text}:{icon:React.ReactNode;title:string;text:string}){return <div className="rounded-xl border border-white/[.06] p-4"><div className="flex items-center gap-2 text-xs text-white">{icon}{title}</div><p className="mt-2 text-[10px] leading-5 text-slate-500">{text}</p></div>}
