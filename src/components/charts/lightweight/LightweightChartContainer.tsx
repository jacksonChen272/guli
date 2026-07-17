import { forwardRef, type ReactNode } from 'react'

interface Props {
  children?: ReactNode
  className?: string
  ariaLabel: string
}

export const LightweightChartContainer = forwardRef<HTMLDivElement, Props>(function LightweightChartContainer(
  { children, className = '', ariaLabel },
  ref,
) {
  return <div className={`relative min-w-0 overflow-hidden rounded-xl bg-[#0b111d] ${className}`}>
    <div ref={ref} role="img" aria-label={ariaLabel} className="h-[430px] min-w-0 touch-pan-y sm:h-[500px]" />
    {children}
  </div>
})

