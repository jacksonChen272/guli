import { Inbox } from 'lucide-react'
export function EmptyState({ title = '目前沒有資料', description = '請調整篩選條件後再試一次。' }: { title?: string; description?: string }) {
  return <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center"><Inbox className="mb-4 text-slate-700" size={30} /><p className="text-sm font-medium text-slate-300">{title}</p><p className="mt-2 text-xs text-slate-600">{description}</p></div>
}
