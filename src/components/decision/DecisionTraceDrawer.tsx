import type { DecisionFactor, DecisionResult } from '../../types/decision'
import { Drawer } from '../ui/Drawer'
import { DecisionFactorCard } from './DecisionFactorCard'
import { DecisionRiskPanel } from './DecisionRiskPanel'
import { DecisionSourceList } from './DecisionSourceList'

export function DecisionTraceDrawer({ decision, open, onClose }: { decision: DecisionResult | null; open: boolean; onClose: () => void }) {
  if (!decision) return <Drawer open={open} onClose={onClose} title="Decision Trace"><div /></Drawer>
  const positive = decision.factors.filter((factor) => factor.direction === 'positive' && factor.contribution !== null)
  const pressure = decision.factors.filter((factor) => factor.direction === 'negative' && factor.contribution !== null)
  const missing = decision.factors.filter((factor) => factor.contribution === null || factor.direction === 'unknown' || factor.sourceType === 'missing')
  return <Drawer open={open} onClose={onClose} title="Decision Trace"><div className="space-y-6 p-5 pb-[max(24px,env(safe-area-inset-bottom))] sm:p-6">
    <div className="grid grid-cols-2 gap-3"><Metric label="公式版本" value={decision.trace.formulaVersion} /><Metric label="可用權重" value={`${(decision.trace.availableWeight * 100).toFixed(0)}%`} /><Metric label="缺少權重" value={`${(decision.trace.missingWeight * 100).toFixed(0)}%`} /><Metric label="權重正規化" value={decision.trace.normalizationApplied ? '已套用' : '未套用'} /></div>
    <FactorGroup title="正向因子" factors={positive} empty="目前沒有正向貢獻因子。" />
    <FactorGroup title="壓力因子" factors={pressure} empty="目前沒有壓力因子。" />
    <FactorGroup title="缺值與資料不足" factors={missing} empty="本次計算沒有缺值因子。" />
    <section><h3 className="mb-3 text-base font-semibold text-white">計算步驟</h3><ol className="space-y-2">{decision.trace.calculationSteps.map((step, index) => <li key={step} className="rounded-xl border border-white/[.05] px-4 py-3 text-sm leading-6 text-slate-400"><span className="mono mr-2 text-brand-300">{index + 1}.</span>{step}</li>)}</ol></section>
    <DecisionRiskPanel risks={decision.risks} />
    <DecisionSourceList sources={decision.sources} warnings={decision.warnings} />
  </div></Drawer>
}

function FactorGroup({ title, factors, empty }: { title: string; factors: DecisionFactor[]; empty: string }) { return <section><h3 className="mb-3 text-base font-semibold text-white">{title}</h3><div className="space-y-3">{factors.length ? factors.map((factor) => <DecisionFactorCard key={factor.code} factor={factor} />) : <p className="rounded-xl border border-dashed border-white/[.08] p-4 text-sm text-slate-500">{empty}</p>}</div></section> }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] p-3"><p className="text-xs text-slate-500">{label}</p><p className="mono mt-2 text-sm text-white">{value}</p></div> }
