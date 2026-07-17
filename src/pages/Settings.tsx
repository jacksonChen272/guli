import { AlertTriangle, Check, Database, LockKeyhole, ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { SectionHeader } from '../components/ui/SectionHeader'
import { providerFactory } from '../providers/ProviderFactory'
import type { ProviderId } from '../providers/ProviderTypes'
import { repositoryHub } from '../repositories/RepositoryHub'
import { useBetaModeStore } from '../stores/betaModeStore'
import type { DataPlatformStatus } from '../types/dataPlatformStatus'

export function Settings() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState<ProviderId>(providerFactory.getActiveId())
  const [platform, setPlatform] = useState<DataPlatformStatus | null>(null)
  const [message, setMessage] = useState('正在驗證已部署的 TWSE 靜態 JSON。')
  const [loading, setLoading] = useState(false)
  const publicBetaMode = useBetaModeStore((state) => state.publicBetaMode)
  const setPublicBetaMode = useBetaModeStore((state) => state.setPublicBetaMode)

  const loadPlatform = useCallback(async (force = false) => {
    const status = await repositoryHub.getPlatformDataStatus(force)
    setPlatform(status)
    setActiveId(status.providerId)
    setMessage(status.migrationNotice ?? status.summary)
    return status
  }, [])

  useEffect(() => {
    let active = true
    void repositoryHub.getPlatformDataStatus().then((status) => {
      if (!active) return
      setPlatform(status)
      setActiveId(status.providerId)
      setMessage(status.migrationNotice ?? status.summary)
    }).catch((reason: unknown) => {
      if (active) setMessage(reason instanceof Error ? reason.message : '資料狀態讀取失敗。')
    })
    return () => { active = false }
  }, [])

  const select = async (id: ProviderId) => {
    if (!repositoryHub.selectProvider(id)) {
      setMessage('此資料來源尚未啟用。')
      return
    }
    setLoading(true)
    setActiveId(id)
    repositoryHub.industrySnapshots.clearCache()
    try {
      const status = await loadPlatform(true)
      setMessage(id === 'twse'
        ? status.summary
        : '已明確切換為 Mock。公開測試模式會持續顯示 Mock Badge，且不會偽裝為官方行情。')
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : '資料來源切換失敗；可回到 Mock 繼續使用。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="DATA PLATFORM SETTINGS · GULI v1.0.0-beta.3" title="資料來源設定" description="公開測試模式會分開揭露 Official、Derived、Mock、Fallback、Stale 與 Missing。"/>
      <Card title="公開測試模式" eyebrow="BETA DATA GUARD">
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3"><ShieldCheck size={20} className="mt-1 shrink-0 text-brand-300"/><div><p className="font-medium text-white">Mock 不得偽裝為真實行情</p><p className="mt-1 text-sm leading-6 text-slate-400">預設啟用；缺資料顯示尚未取得，所有核心頁面保留資料可信度與免責提示。</p></div></div>
          <button type="button" role="switch" aria-label="公開測試模式" aria-checked={publicBetaMode} onClick={() => setPublicBetaMode(!publicBetaMode)} className={`relative h-11 w-20 shrink-0 rounded-full border transition-colors ${publicBetaMode ? 'border-brand-400/30 bg-brand-400/20' : 'border-white/10 bg-white/[.04]'}`}><span className={`absolute top-1.5 h-8 w-8 rounded-full bg-white transition-transform ${publicBetaMode ? 'translate-x-10' : 'translate-x-1.5'}`}/></button>
        </div>
      </Card>
      {platform?.canSwitchToTwse && <Card className="border-amber-300/20" title="目前仍使用 Mock 市場資料" eyebrow="ACTION REQUIRED"><div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-start gap-2 text-sm leading-6 text-amber-100/90"><AlertTriangle size={17} className="mt-1 shrink-0"/>這是本版本中明確保留的 Mock 選擇；TWSE JSON 可用時不會把它靜默標示為官方資料。</p><Button className="min-h-11 shrink-0" onClick={() => void select('twse')} disabled={loading}>切換至 TWSE 官方資料</Button></div></Card>}
      <Card title="市場總覽 Provider" eyebrow="PROVIDERS">
        <div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2">{providerFactory.list().map((provider) => <article key={provider.id} className={`rounded-2xl border p-5 ${activeId === provider.id ? 'border-brand-400/35 bg-brand-400/[.045]' : 'border-[var(--border-subtle)] bg-white/[.015]'}`}><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><Database size={20} className="mt-1 shrink-0 text-slate-400"/><div><h3 className="text-lg font-semibold text-white">{provider.name}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{provider.description}</p></div></div><span className="text-xs text-slate-400">{provider.enabled ? '可用' : '未啟用'}</span></div><Button className="mt-5 min-h-11 w-full" disabled={loading || !provider.enabled || activeId === provider.id} onClick={() => void select(provider.id)} icon={activeId === provider.id ? <Check size={17}/> : provider.enabled ? <Database size={17}/> : <LockKeyhole size={17}/>}>{activeId === provider.id ? '目前使用' : provider.enabled ? '切換' : '尚未開放'}</Button></article>)}</div>
        <p className="border-t border-[var(--border-subtle)] px-5 py-4 text-sm leading-6 text-slate-400 sm:px-6">{message}</p>
      </Card>
      <Card title="資料平台最終狀態" eyebrow="PROVENANCE"><div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4"><Metric label="市場" value={platform?.market ?? '讀取中'}/><Metric label="個股" value={platform?.stocks ?? '讀取中'}/><Metric label="法人" value={platform?.institutions ?? '讀取中'}/><Metric label="產業" value={platform?.industry ?? '讀取中'}/></div><div className="flex flex-wrap gap-3 border-t border-white/[.05] p-5"><Button onClick={() => navigate('/data-status/stocks')}>個股資料狀態</Button><Button variant="ghost" onClick={() => navigate('/data-coverage')}>資料覆蓋率</Button></div></Card>
      <Card title="版本資訊" eyebrow="SYSTEM"><div className="grid gap-4 p-5 sm:grid-cols-3"><Metric label="GULI" value="v1.0.0-beta.3"/><Metric label="正式資料" value="TWSE 市場／個股／法人／個股歷史盤後"/><Metric label="規則推導" value="技術指標、固定訊號、Decision、Heatmap 與部分產業分析"/></div></Card>
      <Card title="資料免責聲明" eyebrow="INFORMATION ONLY"><div className="p-5 text-sm leading-7 text-slate-400"><p>市場熱力圖、今日市場摘要與觀察名單均由固定規則整理；產業 mapping 仍含規則推導或模擬成分。</p><p className="mt-2">部分樣本不代表全市場，缺值不以 0 補入。本平台內容僅供資訊參考，不構成投資建議、買賣邀約或獲利保證。</p></div></Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-base font-medium text-white">{value}</p></div> }
