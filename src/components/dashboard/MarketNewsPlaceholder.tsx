import { Bell, CalendarDays, Newspaper } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const placeholders = [
  { title: '上市公司重大訊息', description: '未來將整理盤後重大公告與法說會重點。', icon: Bell },
  { title: '產業與族群焦點', description: '未來將彙整影響熱門族群的產業消息。', icon: Newspaper },
  { title: '總體經濟與政策', description: '未來將呈現影響台股的政策與重要經濟日程。', icon: CalendarDays },
]

export function MarketNewsPlaceholder() {
  return <Card title="最新消息" eyebrow="即將推出" action={<Badge tone="neutral">尚未接入新聞來源</Badge>}>
    <div className="grid gap-px bg-white/[.06] md:grid-cols-3">{placeholders.map(({ title, description, icon: Icon }) => <article key={title} className="min-w-0 bg-[var(--bg-card)] p-5 sm:p-6"><span className="grid h-10 w-10 place-items-center rounded-xl border border-white/[.07] bg-white/[.025] text-slate-400"><Icon size={18}/></span><h3 className="mt-4 text-sm font-semibold text-slate-200">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-500">{description}</p></article>)}</div>
    <p className="border-t border-white/[.06] px-5 py-4 text-xs leading-5 text-slate-600">目前不顯示虛構新聞；正式新聞來源接入後，將清楚標示來源與發布時間。</p>
  </Card>
}
