import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className={`relative inline-flex min-w-28 items-center ${className}`}><select className="h-10 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0d1317] py-0 pl-3 pr-8 text-[11px] text-slate-300 outline-none transition focus:border-brand-400/30" {...props}>{children}</select><ChevronDown className="pointer-events-none absolute right-2.5 text-slate-600" size={13} /></label>
}
