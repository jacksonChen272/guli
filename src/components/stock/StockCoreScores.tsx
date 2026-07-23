import { Activity, Camera, HeartPulse, Scale } from 'lucide-react'
import { useState } from 'react'
import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'

const scoreText = (score: number | null | undefined, digits = 0) => score === null || score === undefined ? '—' : score.toFixed(digits)

export function StockCoreScores({ data, onOpenDecisionTrace }: { data: StockAnalysisData; onOpenDecisionTrace: () => void }) {
  const [open, setOpen] = useState<string | null>(null)
  const cards = [
    { id: 'decision', label: 'GULI 決策分數', value: data.decision?.score ?? null, grade: data.decision?.label ?? '資料不足', confidence: data.decision?.confidence ?? null, date: data.decision?.tradeDate ?? null, source: 'decision-v1.0', explanation: data.decision?.summary ?? '尚未取得 Decision 結果。', icon: Scale },
    { id: 'technical', label: '技術分數', value: data.technicalIndex?.technicalScore ?? null, grade: data.technicalIndex?.technicalLabel ?? '資料不足', confidence: data.technicalIndex?.technicalConfidence ?? null, date: data.technicalIndex?.tradeDate ?? null, source: 'technical-v1.0', explanation: '由官方歷史行情的趨勢、動能、量能、MACD、位置與風險固定權重計算。', icon: Activity },
    { id: 'health', label: '健康分數', value: data.health?.totalScore ?? null, grade: data.health ? data.health.totalScore >= 81 ? '強勢' : data.health.totalScore >= 66 ? '偏多' : data.health.totalScore >= 51 ? '中性' : data.health.totalScore >= 36 ? '偏弱' : '弱勢' : '資料不足', confidence: null, date: data.quote?.tradeDate ?? null, source: 'Health（含模擬因子）', explanation: data.health?.summary ?? '健康因子資料尚未取得。', icon: HeartPulse },
    { id: 'snapshot', label: '單日快照分數', value: data.snapshot?.snapshotScore ?? null, grade: data.snapshot?.status ?? '資料不足', confidence: null, date: data.snapshot?.tradeDate ?? null, source: 'Stock Snapshot v1.0', explanation: '反映單日價量、流動性與估值風險；不代表中長期趨勢。', icon: Camera },
  ]
  return <section aria-label="四項核心分數"><div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="eyebrow">FOUR INDEPENDENT SCORES</p><h2 className="mt-1 text-xl font-semibold text-white">四項核心觀察分數</h2></div><p className="max-w-xl text-xs leading-5 text-amber-200/80">四項分數採不同資料與公式，不能直接互相比較，也不會平均成第五項分數。</p></div><div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map((item) => { const Icon = item.icon; return <Card key={item.id} className="min-w-0" interactive><div className="p-4 sm:p-5"><div className="flex items-start justify-between gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-400/10 text-brand-300"><Icon size={18}/></span><Badge tone={item.value === null ? 'warning' : 'neutral'}>{item.grade}</Badge></div><p className="mt-4 text-xs text-slate-500">{item.label}</p><p className="mono mt-1 text-3xl font-semibold text-white">{scoreText(item.value, item.id === 'decision' || item.id === 'technical' ? 1 : 0)}</p><div className="mt-3 space-y-1 text-[11px] text-slate-500"><p>信心：{item.confidence === null ? '未提供' : `${Math.round(item.confidence)}%`}</p><p>{item.date ?? '日期未取得'} · {item.source}</p></div><Button className="mt-4 w-full" size="sm" variant="ghost" onClick={() => item.id === 'decision' ? onOpenDecisionTrace() : setOpen(open === item.id ? null : item.id)}>為什麼？</Button>{open === item.id && <p className="mt-3 border-t border-white/[.06] pt-3 text-xs leading-5 text-slate-400">{item.explanation}</p>}</div></Card> })}</div></section>
}
