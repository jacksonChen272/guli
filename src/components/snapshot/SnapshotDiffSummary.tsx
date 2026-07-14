import type { MarketSnapshotDiff } from '../../types/snapshot'
import { formatSigned } from '../../services/snapshot/SnapshotFormatter'
export function SnapshotDiffSummary({ diff }: { diff: MarketSnapshotDiff }) {
  if (!diff.hasPrevious) return <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[.018] px-4 py-3 text-[11px] text-slate-500">尚無前一交易日資料可比較。</div>
  return <div className="grid gap-2 sm:grid-cols-3"><Diff label="市場溫度" value={formatSigned(diff.temperature.change, ' 分')}/><Diff label="加權指數" value={formatSigned(diff.index.change, ' 點')}/><Diff label="成交金額" value={diff.tradingAmount.change === null ? '無資料' : formatSigned(diff.tradingAmount.change / 100_000_000, ' 億')}/><p className="sm:col-span-3 text-[10px] text-slate-500">{diff.marketStatusChanged ? `狀態由「${diff.previousMarketStatus}」轉為「${diff.currentMarketStatus}」` : `市場狀態維持「${diff.currentMarketStatus}」`}；新進強勢榜：{diff.addedTopIndustries.join('、') || '無'}。</p></div>
}
function Diff({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[var(--border-subtle)] bg-white/[.018] p-3"><p className="text-[9px] text-slate-600">{label}</p><p className="mono mt-1 text-xs text-slate-200">{value}</p></div> }
