import { Check, Database, LockKeyhole, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { providerFactory } from '../providers/ProviderFactory'
import type { ProviderId } from '../providers/ProviderTypes'
import { repositoryHub } from '../repositories/RepositoryHub'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'

export function Settings() {
  const [activeId, setActiveId] = useState<ProviderId>(providerFactory.getActiveId())
  const [message, setMessage] = useState('Mock 與 TWSE 官方盤後市場總覽可使用；FinMind、Yahoo 尚未啟用。')
  const [loading, setLoading] = useState(false)
  const providers = providerFactory.list()
  const select = async (id: ProviderId) => {
    if (!repositoryHub.selectProvider(id)) { setMessage('此資料來源尚未開放，本 Sprint 不會連線該服務。'); return }
    setLoading(true); setActiveId(id)
    const result = await repositoryHub.refreshMarket()
    setLoading(false)
    const official = result.data.officialMarket
    if (id === 'twse' && official?.status === 'fallback') setMessage(`TWSE JSON 無法使用，已安全回退 Mock：${official.warnings[0] ?? '請確認資料檔。'}`)
    else setMessage(id === 'twse' ? '已讀取網站內 TWSE 官方盤後 JSON；瀏覽器不會直接呼叫 TWSE。' : '已切換至 Mock，Repository Cache 已重新建立。')
  }
  return <div className="space-y-5">
    <SectionHeader eyebrow="DATA PLATFORM SETTINGS" title="資料來源設定" description="選擇市場總覽資料來源。個股、產業、法人、櫃買資訊目前仍固定使用模擬資料。"/>
    <Card title="資料供應者" eyebrow="PROVIDERS">
      <div className="grid gap-3 p-5 lg:grid-cols-2">{providers.map((provider) => <article key={provider.id} className={`rounded-2xl border p-4 transition ${activeId === provider.id ? 'border-brand-400/35 bg-brand-400/[.045]' : 'border-[var(--border-subtle)] bg-white/[.015]'}`}>
        <div className="flex items-start justify-between gap-4"><div className="flex min-w-0 gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[.07] bg-white/[.025] text-slate-400"><Database size={17}/></span><div><h3 className="text-sm font-medium text-white">{provider.name}</h3><p className="mt-1 text-[11px] leading-5 text-slate-500">{provider.description}</p></div></div><span className={`rounded-full px-2 py-1 text-[9px] ${provider.enabled ? 'bg-brand-400/10 text-brand-300' : 'bg-white/[.04] text-slate-600'}`}>{provider.enabled ? '可使用' : '未啟用'}</span></div>
        <Button className="mt-4 min-h-11 w-full" disabled={loading || !provider.enabled || activeId === provider.id} onClick={() => void select(provider.id)} icon={activeId === provider.id ? <Check size={14}/> : provider.enabled ? <Database size={14}/> : <LockKeyhole size={14}/>}>{activeId === provider.id ? '目前使用中' : provider.enabled ? '切換至此來源' : '未來版本開放'}</Button>
      </article>)}</div>
      <div className="flex flex-col gap-3 border-t border-[var(--border-subtle)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p role="status" className="text-[11px] leading-5 text-slate-500">{message}</p>{activeId === 'twse' && <Button size="sm" variant="ghost" onClick={() => void select('mock')} icon={<RotateCcw size={13}/>}>回到 Mock</Button>}</div>
    </Card>
    <Card title="版本資訊" eyebrow="SYSTEM"><div className="grid gap-3 p-5 text-[11px] sm:grid-cols-3"><div><p className="text-slate-600">GULI</p><p className="mt-1 text-slate-200">v0.5.2</p></div><div><p className="text-slate-600">市場資料</p><p className="mt-1 text-slate-200">TWSE 官方盤後／Mock</p></div><div><p className="text-slate-600">行情性質</p><p className="mt-1 text-slate-200">非即時行情</p></div></div></Card>
  </div>
}
