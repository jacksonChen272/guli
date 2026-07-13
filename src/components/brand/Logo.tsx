type LogoProps = { compact?: boolean }

export function Logo({ compact = false }: LogoProps) {
  return (
    <div className="flex items-center gap-3" aria-label="股勵 GULI">
      <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-brand-400/30 bg-brand-400/10 shadow-glow">
        <span className="absolute -bottom-2 -right-1 h-6 w-6 rotate-45 border-l border-brand-300/30" />
        <span className="text-lg font-bold tracking-tighter text-brand-300">股</span>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="text-[17px] font-bold tracking-[0.12em] text-white">股勵</div>
          <div className="mono mt-1 text-[9px] font-medium tracking-[0.32em] text-brand-400">GULI</div>
        </div>
      )}
    </div>
  )
}
