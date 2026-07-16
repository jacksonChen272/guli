import { Check, Database, LockKeyhole, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { providerFactory } from '../providers/ProviderFactory'
import type { ProviderId } from '../providers/ProviderTypes'
import { repositoryHub } from '../repositories/RepositoryHub'
import type { OfficialStockDatasetStatus } from '../types/officialStockData'

export function Settings() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<ProviderId>(providerFactory.getActiveId())
  const [message, setMessage] = useState('市場總覽可切換 Mock 或 TWSE；上市股票每日資料獨立讀取 TWSE 靜態 JSON。')
  const [loading, setLoading] = useState(false)
  const [stocks, setStocks] = useState<OfficialStockDatasetStatus | null>(null)
  useEffect(() => { void repositoryHub.stocks.getOfficialDatasetStatus().then(setStocks) }, [])
  const select = async (id: ProviderId) => {
    if (!repositoryHub.selectProvider(id)) { setMessage('此資料來源尚未啟用。'); return }
    setLoading(true); setActiveId(id); repositoryHub.industrySnapshots.clearCache()
    const result = await repositoryHub.refreshMarket(); setLoading(false)
    const official = result.data.officialMarket
    if (id === 'twse' && official?.status === 'fallback') setMessage(`TWSE 市場總覽不可用，已回退 Mock：${official.warnings[0] ?? '資料驗證失敗'}`)
    else setMessage(id === 'twse' ? '已切換 TWSE 市場總覽靜態 JSON。' : '已切換 Mock 市場總覽。')
  }
  return <div className="space-y-8">
    <SectionHeader eyebrow="DATA PLATFORM SETTINGS" title="資料來源設定" description="市場總覽 Provider 與上市個股每日資料分開管理；瀏覽器不直接呼叫外部 API。" />
    <Card title="市場總覽 Provider" eyebrow="PROVIDERS"><div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">{providerFactory.list().map((provider) => <article key={provider.id} className={`rounded-2xl border p-5 ${activeId === provider.id ? 'border-brand-400/35 bg-brand-400/[.045]' : 'border-[var(--border-subtle)] bg-white/[.015]'}`}><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Database size={20} className="mt-1 text-slate-400" /><div><h3 className="text-lg font-semibold text-white">{provider.name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{provider.description}</p></div></div><span className="text-xs text-slate-400">{provider.enabled ? '可用' : '未啟用'}</span></div><Button className="mt-5 w-full" disabled={loading || !provider.enabled || activeId === provider.id} onClick={() => void select(provider.id)} icon={activeId === provider.id ? <Check size={17} /> : provider.enabled ? <Database size={17} /> : <LockKeyhole size={17} />}>{activeId === provider.id ? '目前使用' : provider.enabled ? '切換' : '尚未開放'}</Button></article>)}</div><div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-sm text-slate-400">{message}</p>{activeId === 'twse' && <Button variant="ghost" onClick={() => void select('mock')} icon={<RotateCcw size={16} />}>回到 Mock</Button>}</div></Card>
    <Card title="TWSE 上市個股每日資料" eyebrow="OFFICIAL STOCK DATA"><div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-5">{[{ label: '狀態', value: stocks?.status ?? '讀取中' }, { label: '交易日期', value: stocks?.tradeDate ?? '—' }, { label: '有效筆數', value: stocks?.recordCount.toLocaleString() ?? '—' }, { label: 'Stale', value: stocks?.stale ? '是' : '否' }, { label: 'Fallback', value: stocks?.available ? '不需要' : '使用 Mock' }].map((item) => <Metric key={item.label} label={item.label} value={item.value} />)}</div><div className="border-t border-white/[.05] p-5 sm:px-6"><Button onClick={() => navigate('/data-status/stocks')}>查看完整個股資料狀態</Button></div></Card>
    <Card title="版本資訊" eyebrow="SYSTEM"><div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6"><Metric label="GULI" value="v0.7.2 · Professional Workspace" /><Metric label="正式資料" value="TWSE 市場總覽／上市個股盤後" /><Metric label="仍為 Mock／derived" value="法人、技術指標、健康分數" /></div></Card>
  </div>
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-base font-medium text-white">{value}</p></div> }
