import { CalendarClock, Landmark, Presentation, Scale } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const categories = [{ label: '法說', icon: Presentation }, { label: 'CPI', icon: Scale }, { label: 'Fed', icon: Landmark }, { label: '除權息', icon: CalendarClock }]

export function TodayEventsCard() {
  return <Card title="今日重要事件" eyebrow="MARKET CALENDAR" action={<Badge tone="neutral">Coming Soon</Badge>}>
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4 sm:p-5">{categories.map(({ label, icon: Icon }) => <div key={label} className="rounded-xl border border-dashed border-white/[.09] bg-white/[.01] p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-white/[.035] text-slate-400"><Icon size={17}/></span><p className="mt-3 text-sm font-medium text-slate-300">{label}</p><p className="mt-1 text-xs text-slate-600">資料來源尚未串接</p></div>)}</div>
    <p className="border-t border-white/[.06] px-4 py-3 text-xs leading-5 text-slate-600 sm:px-5">本區僅保留未來事件資料入口，目前不顯示日期、標題或可能影響，避免虛構市場事件。</p>
  </Card>
}

