import { Eye, ShieldAlert } from 'lucide-react'
import type { WatchlistDashboardRow, WatchlistTodayAction } from '../../types/watchlistDashboard'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function WatchlistTodayActions({ actions, rows, onSelect }: { actions: WatchlistTodayAction[]; rows: WatchlistDashboardRow[]; onSelect: (row: WatchlistDashboardRow) => void }) {
  const groups = { observe: actions.filter((item) => item.kind === 'observe').slice(0, 4), caution: actions.filter((item) => item.kind === 'caution').slice(0, 4) }
  return <Card title="Today Action" eyebrow="規則型觀察 · 非投資建議"><div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-2"><ActionGroup title="今天值得注意" icon={<Eye size={18} />} tone="up" actions={groups.observe} rows={rows} onSelect={onSelect} /><ActionGroup title="今天需留意" icon={<ShieldAlert size={18} />} tone="warning" actions={groups.caution} rows={rows} onSelect={onSelect} /></div></Card>
}

function ActionGroup({ title, icon, tone, actions, rows, onSelect }: { title: string; icon: React.ReactNode; tone: 'up' | 'warning'; actions: WatchlistTodayAction[]; rows: WatchlistDashboardRow[]; onSelect: (row: WatchlistDashboardRow) => void }) {
  return <section><h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-white">{icon}{title}</h3><div className="space-y-3">{actions.map((action) => <button type="button" key={action.id} onClick={() => { const row = rows.find((item) => item.symbol === action.symbol); if (row) onSelect(row) }} className="min-h-[72px] w-full rounded-xl border border-white/[.06] p-4 text-left hover:border-brand-400/25 hover:bg-white/[.018]"><div className="flex items-center justify-between gap-2"><span className="text-base font-medium text-white">{action.symbol} {action.name}</span><Badge tone={tone}>{action.kind === 'observe' ? '觀察' : '留意'}</Badge></div><p className="mt-2 text-sm leading-6 text-slate-400">{action.reasons.join(' · ')}</p></button>)}{!actions.length && <p className="rounded-xl border border-dashed border-white/[.06] p-6 text-center text-sm text-slate-500">目前沒有符合條件的項目。</p>}</div></section>
}
