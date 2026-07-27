import { useEffect, useRef, useState } from 'react'

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

export function DashboardCountUpValue({
  value,
  formatter,
  className = '',
  duration = 620,
}: {
  value: number | null | undefined
  formatter: (value: number) => string
  className?: string
  duration?: number
}) {
  const [displayValue, setDisplayValue] = useState<number | null>(() => finite(value) ? value : null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!finite(value)) {
      setDisplayValue(null)
      return
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    if (hasAnimated.current || reduceMotion) {
      hasAnimated.current = true
      setDisplayValue(value)
      return
    }

    hasAnimated.current = true
    const startedAt = performance.now()
    const startValue = 0
    let frame = 0

    const update = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayValue(startValue + (value - startValue) * eased)
      if (progress < 1) frame = requestAnimationFrame(update)
    }

    frame = requestAnimationFrame(update)
    return () => cancelAnimationFrame(frame)
  }, [duration, value])

  return (
    <span
      className={`dashboard-count-up tabular-nums ${className}`}
      data-numeric
      data-count-up="first-load"
    >
      {displayValue === null ? '尚未取得' : formatter(displayValue)}
    </span>
  )
}
