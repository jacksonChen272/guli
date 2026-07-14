import { Check, Plus, Star } from 'lucide-react'
import { useWatchlistStore } from '../../stores/watchlistStore'
import { Button } from '../ui/Button'

export function WatchlistButton({ symbol, compact = false }: { symbol: string; compact?: boolean }) {
  const active = useWatchlistStore((state) => state.items.some((item) => item.symbol === symbol))
  const toggle = useWatchlistStore((state) => state.toggle)
  return <Button variant={active ? 'secondary' : 'primary'} size="sm" onClick={() => toggle(symbol)} aria-pressed={active} icon={compact ? <Star size={14} fill={active ? 'currentColor' : 'none'} /> : active ? <Check size={14} /> : <Plus size={14} />}>{compact ? '' : active ? '已加入自選股' : '加入自選股'}</Button>
}
