import { Info } from 'lucide-react'
export function Disclaimer({ children }: { children: string }) {
  return <div className="flex items-start gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-[10px] leading-5 text-slate-600"><Info className="mt-0.5 shrink-0" size={12} />{children}</div>
}
