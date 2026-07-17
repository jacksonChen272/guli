import { BarChart3 } from 'lucide-react'

export function ChartEmptyState({ message = '尚無可顯示的官方歷史行情。' }: { message?: string }) {
  return <div className="grid min-h-[430px] place-items-center rounded-xl border border-dashed border-white/10 bg-white/[.015] p-6 text-center">
    <div><BarChart3 className="mx-auto text-slate-600" size={30}/><p className="mt-3 text-sm text-slate-400">{message}</p></div>
  </div>
}

