type LogoProps = { compact?: boolean; showTagline?: boolean }

export function LogoMark({ className = 'h-10 w-10' }: { className?: string }) {
  return <svg className={className} viewBox="0 0 48 48" role="img" aria-label="股勵 GULI 圖形標誌"><rect x="1" y="1" width="46" height="46" rx="13" fill="#101a1c" stroke="#2fc59a" strokeOpacity=".42" /><path d="M33.5 16.5a13 13 0 1 0 2.1 14.4" fill="none" stroke="#53d9b2" strokeWidth="3.2" strokeLinecap="round" /><path d="M25 28h11v8" fill="none" stroke="#53d9b2" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.5 29.5 19 24l5 3.5 9-10" fill="none" stroke="#4c9ee8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M19 19v9M17 21h4M31 12v9M29 15h4" stroke="#edf2f0" strokeWidth="1.7" strokeLinecap="round" /></svg>
}

export function Logo({ compact = false, showTagline = true }: LogoProps) {
  return <div className="flex items-center gap-3" aria-label="股勵 GULI，看見資金，看懂趨勢。"><LogoMark />{!compact && <div className="min-w-0"><div className="flex items-baseline gap-2"><span className="text-[17px] font-bold tracking-[.1em] text-white">股勵</span><span className="mono text-[9px] font-medium tracking-[.24em] text-brand-400">GULI</span></div>{showTagline && <p className="mt-1 whitespace-nowrap text-[9px] tracking-[.08em] text-slate-600">看見資金，看懂趨勢。</p>}</div>}</div>
}
