import { ChevronLeft, ChevronRight, Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { tradingDates } from '../../data/mockStocks'
import { Button } from '../ui/Button'
import { Select } from '../ui/Select'

export function RotationPlayback({ dateIndex, onDateChange, showTrails, onTrailsChange }: { dateIndex: number; onDateChange: (index: number) => void; showTrails: boolean; onTrailsChange: (value: boolean) => void }) {
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(.5)
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => onDateChange(dateIndex >= tradingDates.length - 1 ? 0 : dateIndex + 1), 1000 / speed)
    return () => window.clearInterval(timer)
  }, [dateIndex, onDateChange, playing, speed])
  return <div className="panel p-4 sm:p-5"><div className="flex flex-col gap-4 xl:flex-row xl:items-center"><div className="flex items-center gap-2"><Button size="sm" variant={playing ? 'primary' : 'secondary'} onClick={() => setPlaying((value) => !value)} icon={playing ? <Pause size={13} /> : <Play size={13} />}>{playing ? '暫停' : '播放'}</Button><button type="button" onClick={() => onDateChange(Math.max(0, dateIndex - 1))} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="上一日"><ChevronLeft size={17} /></button><button type="button" onClick={() => onDateChange(Math.min(tradingDates.length - 1, dateIndex + 1))} className="rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="下一日"><ChevronRight size={17} /></button><Button size="sm" variant="ghost" onClick={() => { setPlaying(false); onDateChange(tradingDates.length - 1) }} icon={<RotateCcw size={13} />}>回到最新</Button></div><div className="flex min-w-0 flex-1 items-center gap-3"><span className="mono w-[76px] shrink-0 text-[10px] text-brand-300">{tradingDates[dateIndex]}</span><input type="range" min={0} max={tradingDates.length - 1} value={dateIndex} onChange={(event) => onDateChange(Number(event.target.value))} className="h-1 w-full cursor-pointer accent-brand-400" aria-label="回放日期" /></div><div className="flex items-center justify-between gap-4"><label className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-500"><input type="checkbox" checked={showTrails} onChange={(event) => onTrailsChange(event.target.checked)} className="accent-brand-400" /> 顯示近 5 日軌跡</label><Select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} aria-label="播放速度"><option value={.5}>0.5x</option><option value={1}>1x</option><option value={2}>2x</option></Select></div></div></div>
}
