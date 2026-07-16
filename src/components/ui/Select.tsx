import { ChevronDown } from 'lucide-react'
import type { SelectHTMLAttributes } from 'react'
export function Select({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <label className={`relative inline-flex min-w-28 items-center ${className}`}><select className="h-11 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0d1317] py-0 pl-3 pr-9 text-sm text-slate-200 outline-none transition focus:border-brand-400/40" {...props}>{children}</select><ChevronDown className="pointer-events-none absolute right-3 text-slate-400" size={16} /></label>
}
