export type TabOption<T extends string> = { value: T; label: string }
export function Tabs<T extends string>({ options, value, onChange, className = '' }: { options: TabOption<T>[]; value: T; onChange: (value: T) => void; className?: string }) {
  return <div className={`inline-flex rounded-xl border border-white/[0.07] bg-black/20 p-1 ${className}`} role="tablist">{options.map((option) => <button type="button" role="tab" aria-selected={value === option.value} key={option.value} onClick={() => onChange(option.value)} className={`rounded-lg px-3 py-2 text-[11px] transition ${value === option.value ? 'bg-white/[0.08] text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}>{option.label}</button>)}</div>
}
