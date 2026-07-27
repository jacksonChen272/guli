import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Eye,
  GitBranch,
  Landmark,
  MinusCircle,
  ShieldCheck,
  Star,
} from 'lucide-react'
import type { StockCommandViewModel } from '../../services/stock/StockScoreViewModel'
import { DashboardCard } from '../dashboard/DashboardCard'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'

interface StockCommandCenterProps {
  model: StockCommandViewModel
  isWatchlisted: boolean
  onViewTechnical: () => void
  onViewInstitutional: () => void
  onViewIndustry: () => void
  onToggleWatchlist: () => void
}

export function StockCommandCenter({
  model,
  isWatchlisted,
  onViewTechnical,
  onViewInstitutional,
  onViewIndustry,
  onToggleWatchlist,
}: StockCommandCenterProps) {
  return (
    <DashboardCard
      title="Stock Command Center"
      eyebrow="TODAY'S RULE-BASED VIEW"
      subtitle="以既有規則整理趨勢、法人、快照與風險；所有結論均可追溯至目前資料。"
      updatedAt={model.tradeDate}
      data-testid="stock-command-center"
      action={(
        <div className="flex flex-wrap justify-end gap-2">
          <Badge tone="brand">{model.stance}</Badge>
          <Badge tone="info">
            Confidence {model.confidence === null ? '尚未取得' : `${Math.round(model.confidence)}%`}
          </Badge>
        </div>
      )}
    >
      <div className="grid min-w-0 gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
        <section
          className="rounded-2xl border border-brand-400/15 bg-brand-400/[.025] p-4 sm:p-5"
          aria-label="今日規則式研究結論"
        >
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.16em] text-brand-300">
            <Eye size={16} aria-hidden="true" />
            研究結論
          </p>
          <h2 className="mt-3 line-clamp-3 text-lg font-semibold leading-8 text-white sm:line-clamp-2 sm:text-xl">
            {model.headline}
          </h2>
          <dl className="mt-5 grid grid-cols-2 gap-3">
            <State label="技術趨勢" value={model.trend} icon={<GitBranch size={15} aria-hidden="true" />} />
            <State label="法人狀態" value={model.institutional} icon={<Landmark size={15} aria-hidden="true" />} />
            <State label="單日快照" value={model.snapshot} icon={<Activity size={15} aria-hidden="true" />} />
            <State label="風險層級" value={model.risk} icon={<ShieldCheck size={15} aria-hidden="true" />} />
          </dl>
        </section>

        <div className="grid min-w-0 content-start gap-4 md:grid-cols-2">
          <FactorList
            title="主要正向因子"
            icon={<CheckCircle2 size={17} className="text-red-300" aria-hidden="true" />}
            items={model.positiveFactors}
          />
          <FactorList
            title="主要風險"
            icon={<AlertTriangle size={17} className="text-amber-300" aria-hidden="true" />}
            items={model.riskFactors}
          />
          <FactorList
            title="中性觀察"
            icon={<MinusCircle size={17} className="text-slate-400" aria-hidden="true" />}
            items={model.neutralFactors}
            className="md:col-span-2"
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[.06] px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
        <p className="text-xs leading-5 text-slate-500">
          資料日 {model.tradeDate ?? '尚未取得'}。內容為固定規則整理，不構成投資建議。
        </p>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label="個股快速操作">
          <Button className="motion-reduce:transition-none" size="sm" variant="primary" onClick={onViewTechnical}>
            <Activity size={16} aria-hidden="true" />
            查看技術分析
          </Button>
          <Button className="motion-reduce:transition-none" size="sm" variant="secondary" onClick={onViewInstitutional}>
            <Landmark size={16} aria-hidden="true" />
            查看法人籌碼
          </Button>
          <Button className="motion-reduce:transition-none" size="sm" variant="secondary" onClick={onViewIndustry}>
            <GitBranch size={16} aria-hidden="true" />
            查看同產業
          </Button>
          <Button className="motion-reduce:transition-none" size="sm" variant="ghost" onClick={onToggleWatchlist}>
            <Star size={16} aria-hidden="true" />
            {isWatchlisted ? '已加入自選' : '加入自選'}
          </Button>
        </div>
      </div>
    </DashboardCard>
  )
}

function State({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-white/[.06] bg-black/10 p-3">
      <dt className="flex items-center gap-2 text-xs text-slate-500">{icon}{label}</dt>
      <dd className="mt-2 break-words text-sm font-medium text-slate-200">{value}</dd>
    </div>
  )
}

function FactorList({
  title,
  icon,
  items,
  className = '',
}: {
  title: string
  icon: React.ReactNode
  items: string[]
  className?: string
}) {
  if (!items.length) return null
  return (
    <section className={`min-w-0 rounded-2xl border border-white/[.06] p-4 sm:p-5 ${className}`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold text-white">{icon}{title}</h3>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-400">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true">•</span>
            <span className="min-w-0 break-words">{item}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
