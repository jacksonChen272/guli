import { Card } from '../components/ui/Card'
import { SettingsWithSnapshot } from './SettingsWithSnapshot'

export function SettingsWithDecision() {
  return <div className="space-y-8">
    <SettingsWithSnapshot/>
    <Card title="Decision Engine 與技術分析基礎" eyebrow="SYSTEM"><div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><Metric label="產品版本" value="GULI v1.0.0-beta.3.1"/><Metric label="公式版本" value="decision-v1.0 · 權重不變"/><Metric label="行情基礎" value="TWSE Official History · technical-v1.0"/></div></Card>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-base font-medium text-white">{value}</p></div> }
