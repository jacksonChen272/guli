import { EmptyState } from '../ui/EmptyState'
import { LoadingState } from '../ui/LoadingState'

export function MarketHeatmapEmptyState({ loading, error }: { loading: boolean; error?: string | null }) {
  if (loading) return <div className="p-5"><LoadingState rows={5}/></div>
  if (error) return <EmptyState title="市場熱力圖暫時無法讀取" description={`${error} 其他首頁資訊仍可正常使用。`}/>
  return <EmptyState title="尚無可呈現的分類樣本" description="產業 mapping 或盤後資料不足時不會補造熱力圖排名。"/>
}
