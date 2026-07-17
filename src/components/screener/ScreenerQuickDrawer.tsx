import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { repositoryHub } from '../../repositories/RepositoryHub'
import { calculateTechnicalIndicators } from '../../services/technical/TechnicalIndicatorService'
import type { OfficialStockHistory } from '../../types/officialStockHistory'
import type { ScreenerResult } from '../../types/screener'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { LoadingState } from '../ui/LoadingState'

const CandlestickPriceChart = lazy(() => import('../charts/lightweight/CandlestickPriceChart'))
const visibility = { ma5: true, ma20: true, ma60: false, bollinger: false, volume: true }

export function ScreenerQuickDrawer({ row, onClose }: { row: ScreenerResult | null; onClose: () => void }) {
  const navigate = useNavigate()
  const [history, setHistory] = useState<OfficialStockHistory | null>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  useEffect(() => {
    let active = true
    if (!row) { setHistory(null); setStatus('idle'); return () => { active = false } }
    setStatus('loading')
    void repositoryHub.stockHistory.getHistory(row.symbol).then((dataset) => { if (active) { setHistory(dataset); setStatus('success') } }).catch(() => { if (active) setStatus('error') })
    return () => { active = false }
  }, [row])
  const series = useMemo(() => history ? calculateTechnicalIndicators(history.prices.slice(-90)) : null, [history])
  return <Drawer open={Boolean(row)} onClose={onClose} title={row ? `${row.symbol} ${row.name}｜快速分析` : '快速分析'}>
    {row && <div className="space-y-5 p-5 sm:p-6">
      <div className="grid grid-cols-3 gap-3"><Metric label="Technical" value={row.technicalScore?.toFixed(1) ?? '—'}/><Metric label="Decision" value={row.decisionScore?.toFixed(1) ?? '—'}/><Metric label="Confidence" value={`${row.confidence}%`}/></div>
      <div className="flex flex-wrap gap-2"><Badge tone={row.riskLevel === 'high' ? 'warning' : 'brand'}>風險 {row.riskLevel}</Badge><Badge tone="info">{row.tradeDate}</Badge><Badge tone="neutral">{row.historyRecordCount} 日</Badge></div>
      <section><h3 className="text-sm font-semibold text-white">K 線縮圖</h3><div className="mt-3 overflow-hidden rounded-xl border border-white/[.06]">{status === 'loading' && <LoadingState rows={4}/>} {status === 'error' && <p className="p-5 text-sm text-amber-300">此股票歷史行情尚未取得，無法顯示 K 線。</p>} {status === 'success' && series && <Suspense fallback={<LoadingState rows={4}/>}><CandlestickPriceChart series={series} visibility={visibility}/></Suspense>}</div></section>
      <List title="主要理由" items={row.reasons.slice(0, 4)} tone="text-brand-300"/><List title="主要風險" items={row.risks.length ? row.risks : ['未觸發額外高風險規則']} tone="text-amber-300"/><List title="技術訊號／規則" items={row.matchedRules} tone="text-sky-300"/>
      <Button className="w-full" variant="primary" onClick={() => { onClose(); navigate(`/stock/${row.symbol}`) }}>前往完整個股健檢</Button>
      <p className="text-xs leading-6 text-slate-500">資料來源：{row.sourceSummary.join(' · ')}。固定規則結果不構成投資建議。</p>
    </div>}
  </Drawer>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mono mt-2 text-xl text-white">{value}</p></div> }
function List({ title, items, tone }: { title: string; items: string[]; tone: string }) { return <section><h3 className="text-sm font-semibold text-white">{title}</h3><ul className="mt-2 space-y-2">{items.map((item) => <li key={item} className={`rounded-lg border border-white/[.06] px-3 py-2 text-sm ${tone}`}>{item}</li>)}</ul></section> }
