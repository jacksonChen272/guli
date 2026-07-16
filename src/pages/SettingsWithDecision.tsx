import { Card } from '../components/ui/Card'
import { SettingsWithSnapshot } from './SettingsWithSnapshot'

export function SettingsWithDecision() { return <div className="space-y-8"><SettingsWithSnapshot /><Card title="Decision Engine 與智慧觀察中心" eyebrow="SYSTEM"><div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><Metric label="產品版本" value="GULI v0.7.2 · Professional Workspace" /><Metric label="公式版本" value="decision-v1.0 · watchlist-v1.0" /><Metric label="運作模式" value="固定規則 · 無生成式 AI" /></div></Card></div> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-base font-medium text-white">{value}</p></div> }
