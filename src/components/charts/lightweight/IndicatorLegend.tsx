const items = [
  ['MA5', '#f59e0b'], ['MA20', '#38bdf8'], ['MA60', '#a78bfa'], ['布林上／下軌', '#64748b'],
] as const

export function IndicatorLegend({ visible }: { visible: ChartVisibility }) {
  const enabled = (key: string) => key.startsWith('布林') ? visible.bollinger : visible[key.toLowerCase() as 'ma5' | 'ma20' | 'ma60']
  return <div className="flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-slate-400">
    {items.filter(([key]) => enabled(key)).map(([label, color]) => <span key={label} className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ backgroundColor: color }}/>{label}</span>)}
  </div>
}
import type { ChartVisibility } from './ChartToolbar'

