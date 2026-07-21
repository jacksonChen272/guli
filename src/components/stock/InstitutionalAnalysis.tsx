import { Building2, Info } from 'lucide-react'
import type { StockAnalysisData } from '../../hooks/useStockAnalysisData'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { EmptyState } from '../ui/EmptyState'

const lots = (value: number | null) => value === null ? '尚未取得' : `${value > 0 ? '+' : ''}${Math.round(value / 1000).toLocaleString('zh-TW')} 張`

export function classifyInstitutionalFlow(netVolumePercent: number | null, percentile: number | null) {
  if (netVolumePercent === null) return '資料不足'
  const magnitude = Math.abs(netVolumePercent)
  if (magnitude >= 2 || (percentile ?? 0) >= 90) return netVolumePercent > 0 ? '明顯買超' : '明顯賣超'
  if (magnitude >= 0.5 || (percentile ?? 0) >= 70) return netVolumePercent > 0 ? '買超' : '賣超'
  return '中性'
}

export function InstitutionalAnalysis({ data }: { data: StockAnalysisData }) {
  const record = data.institutional.record
  if (!record) return <Card title="三大法人" eyebrow="TWSE OFFICIAL"><EmptyState title="官方法人資料尚未取得" description="缺值不會以模擬數值填補。"/></Card>
  const rows = [['外資及陸資', record.foreignNetShares], ['投信', record.trustNetShares], ['自營商', record.dealerNetShares], ['三大法人合計', record.totalNetShares]] as const
  const classification = classifyInstitutionalFlow(data.institutional.netVolumePercent, data.institutional.percentile)
  return <Card title="三大法人單日動向" eyebrow="TWSE OFFICIAL INSTITUTIONAL" action={<div className="flex gap-2"><Badge tone="info">TWSE Official</Badge><Badge tone={record.totalNetShares !== null && record.totalNetShares >= 0 ? 'up' : 'down'}>{classification}</Badge></div>}><div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">{rows.map(([label, amount]) => <div key={label} className="rounded-xl border border-white/[.06] p-4"><p className="flex items-center gap-2 text-xs text-slate-500"><Building2 size={14}/>{label}</p><p className={`mono mt-3 text-lg ${amount === null ? 'text-slate-500' : amount >= 0 ? 'text-red-300' : 'text-emerald-300'}`}>{lots(amount)}</p></div>)}</div><div className="flex flex-col gap-2 border-t border-white/[.06] p-5 text-xs leading-5 text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2"><Info size={14} className="mt-0.5 shrink-0"/>僅為 {record.tradeDate} 單日官方資料，不代表連續買賣趨勢。</p><p>占當日成交量 {data.institutional.netVolumePercent === null ? '尚未取得' : `${data.institutional.netVolumePercent.toFixed(2)}%`} · 市場絕對值百分位 {data.institutional.percentile ?? '—'}</p></div></Card>
}
