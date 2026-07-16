import { AlertTriangle, Award, ChevronRight, ShieldAlert, Sparkles } from 'lucide-react'
import type { WatchlistDashboardData, WatchlistDashboardRow } from '../../types/watchlistDashboard'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

export function WatchlistDashboardCards({ data, onSelect }: { data: WatchlistDashboardData; onSelect: (row: WatchlistDashboardRow) => void }) {
  const alert = data.alerts[0]
  const alertRow = alert ? data.rows.find((row) => row.symbol === alert.symbol) : undefined
  const best = data.bestCandidates[0]
  const risk = data.riskRanking[0]
  return <section className="grid gap-5 md:grid-cols-2 2xl:grid-cols-4" aria-label="今日工作台">
    <WorkbenchCard title="今日需注意" eyebrow="SMART ALERT" icon={<AlertTriangle size={20} />} tone="warning" headline={alert ? `${alert.symbol} ${alert.name}` : '目前無重大提醒'} value={alert?.title ?? '規則狀態穩定'} reason={alert?.detail ?? '目前沒有觸發需要立即檢視的觀察規則。'} onClick={alertRow ? () => onSelect(alertRow) : undefined} />
    <WorkbenchCard title="今日最佳候選" eyebrow="TOP CANDIDATE" icon={<Sparkles size={20} />} tone="up" headline={best ? `${best.symbol} ${best.name}` : '尚無候選'} value={best ? `Decision ${format(best.decisionScore)}` : '—'} reason={best?.topPositiveFactors[0]?.explanation ?? best?.tags[0] ?? '目前資料不足以形成候選排序。'} onClick={best ? () => onSelect(best) : undefined} />
    <WorkbenchCard title="今日最高風險" eyebrow="RISK PRIORITY" icon={<ShieldAlert size={20} />} tone="warning" headline={risk ? `${risk.symbol} ${risk.name}` : '尚無風險排序'} value={risk ? `風險 ${risk.riskScore}` : '—'} reason={risk?.topNegativeFactors[0]?.explanation ?? risk?.risks[0]?.explanation ?? '目前沒有顯著扣分因子。'} onClick={risk ? () => onSelect(risk) : undefined} />
    <WorkbenchCard title="自選股整體評分" eyebrow="WATCHLIST QUALITY" icon={<Award size={20} />} tone="brand" headline={`品質等級 ${data.summary.watchlistGrade}`} value={format(data.summary.watchlistScore)} reason={`共 ${data.summary.stockCount} 檔；平均 Decision ${format(data.summary.averageDecision)}，官方資料覆蓋率 ${data.summary.officialCoverageRate}%。`} />
  </section>
}

function WorkbenchCard({ title, eyebrow, icon, tone, headline, value, reason, onClick }: { title: string; eyebrow: string; icon: React.ReactNode; tone: 'brand' | 'up' | 'warning'; headline: string; value: string; reason: string; onClick?: () => void }) {
  const content = <div className="ui-card__content flex min-h-[188px] flex-col">
    <div className="flex items-start justify-between gap-3"><div><p className="text-base font-semibold text-white">{headline}</p><p className="mono metric-medium mt-3 text-white">{value}</p></div><Badge tone={tone}>{icon}</Badge></div>
    <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-400">{reason}</p>
    <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-brand-300">{onClick ? '查看詳情' : '依規則彙整'}<ChevronRight size={16} /></span>
  </div>
  return <Card title={title} eyebrow={eyebrow} variant="compact" interactive={Boolean(onClick)}>{onClick ? <button type="button" onClick={onClick} className="block min-h-0 w-full text-left">{content}</button> : content}</Card>
}

const format = (value: number | null) => value === null ? '—' : value.toFixed(1)
