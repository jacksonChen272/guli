import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { repositoryHub } from '../repositories/RepositoryHub'
import type { StockSnapshotDailyIndex } from '../types/stockSnapshot'
import { Settings } from './Settings'

export function SettingsWithSnapshot() {
  const navigate = useNavigate()
  const [data, setData] = useState<StockSnapshotDailyIndex | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    repositoryHub.stockSnapshots.getLatestIndex()
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : '快照索引不可用'))
  }, [])
  return (
    <div className="space-y-5">
      <Settings/>
      <Card title="Stock Snapshot 資料來源" eyebrow="TWSE OFFICIAL + GULI DERIVED">
        <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Schema" value="snapshot-v1.0"/>
          <Metric label="官方來源" value="TWSE 每日盤後個股"/>
          <Metric label="交易日期" value={data?.tradeDate ?? '—'}/>
          <Metric label="股票筆數" value={data?.recordCount.toLocaleString() ?? '—'}/>
          <Metric label="狀態" value={error ? '讀取失敗' : data ? '可用' : '讀取中'}/>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.06] p-4">
          <div className="flex gap-2"><Badge tone="info">Quote: official</Badge><Badge tone="brand">Scores: derived</Badge></div>
          <Button onClick={() => navigate('/stock-snapshots')}>查看個股快照總覽</Button>
        </div>
        {error && <p className="px-5 pb-4 text-[10px] text-amber-300">{error}</p>}
      </Card>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/[.06] p-3"><p className="text-[9px] text-slate-600">{label}</p><p className="mt-2 text-xs text-white">{value}</p></div>
}
