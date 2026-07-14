import { Home, RefreshCw } from 'lucide-react'
import { Button } from '../ui/Button'

export function PageErrorState({ title = '頁面暫時無法顯示', description = '資料載入或畫面處理發生問題，請稍後再試。' }: { title?: string; description?: string }) {
  return <div className="panel grid min-h-[360px] place-items-center p-8 text-center" role="alert"><div><div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/10 text-amber-300">!</div><h2 className="mt-5 text-lg font-semibold text-white">{title}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p><div className="mt-6 flex flex-wrap justify-center gap-2"><Button onClick={() => window.location.reload()} icon={<RefreshCw size={14}/>}>重新載入頁面</Button><a href={import.meta.env.BASE_URL} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] px-4 text-xs text-slate-300 hover:border-brand-400/25 hover:text-brand-300"><Home size={14}/>返回市場總覽</a></div></div></div>
}
