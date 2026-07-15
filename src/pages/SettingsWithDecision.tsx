import { Card } from '../components/ui/Card'
import { SettingsWithSnapshot } from './SettingsWithSnapshot'
export function SettingsWithDecision(){return <div className="space-y-5"><SettingsWithSnapshot/><Card title="Decision Engine" eyebrow="SYSTEM"><div className="grid gap-3 p-5 sm:grid-cols-3"><Metric label="版本" value="GULI v0.6.0"/><Metric label="公式" value="decision-v1.0"/><Metric label="模式" value="固定規則 · 無生成式 AI"/></div></Card></div>}
function Metric({label,value}:{label:string;value:string}){return <div className="rounded-xl border border-white/[.06] p-3"><p className="text-[9px] text-slate-600">{label}</p><p className="mt-2 text-xs text-white">{value}</p></div>}
