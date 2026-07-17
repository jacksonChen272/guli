import { AlertTriangle } from 'lucide-react'
import { Button } from '../../ui/Button'

export function ChartErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="grid min-h-[430px] place-items-center rounded-xl border border-amber-400/15 bg-amber-400/[.025] p-6 text-center">
    <div><AlertTriangle className="mx-auto text-amber-300" size={30}/><p className="mt-3 max-w-md text-sm leading-6 text-slate-300">{message}</p><Button className="mt-4" variant="ghost" onClick={onRetry}>重新讀取</Button></div>
  </div>
}

