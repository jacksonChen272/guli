import { AlertTriangle, CalendarDays, Database, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DataTrustBanner } from '../components/system/DataTrustBanner'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { LoadingState } from '../components/ui/LoadingState'
import { SectionHeader } from '../components/ui/SectionHeader'
import { repositoryHub } from '../repositories/RepositoryHub'
import { calculateDataCoverage } from '../services/DataCoverageService'
import type { DataCoverageReport } from '../types/dataCoverage'

export function DataCoverage() {
  const [report, setReport] = useState<DataCoverageReport | null>(null)
  useEffect(() => {
    let active = true
    void Promise.all([
      repositoryHub.stocks.getOfficialDatasetStatus(),
      repositoryHub.institutions.getDatasetStatus(),
      repositoryHub.stocks.getOfficialStocks(),
      repositoryHub.stockHistory.getDatasetStatus(),
      repositoryHub.screener.getTechnicalIndex().catch(() => null),
      repositoryHub.screener.getDataset().catch(() => null),
      repositoryHub.stockHistory.getBackfillProgress().catch(() => null),
    ]).then(([stocks, institutions, stockRows, history, technical, screener, backfill]) => {
      if (!active) return
      setReport(calculateDataCoverage({
        marketAvailable: Boolean(repositoryHub.getSnapshot().overview.officialMarket),
        stockRecords: stockRows.length,
        targetStocks: Math.max(stockRows.length, 1),
        institutionalRecords: institutions.recordCount,
        institutionalTarget: Math.max(stockRows.length, 1),
        industryOfficialRecords: 0,
        industryTarget: 12,
        historyDays: history.averageRecordCount,
        historyStockCoverageCount: history.availableSymbols,
        historyAverageDays: history.averageRecordCount,
        historyComplete250Percent: history.complete250Percent,
        indicatorComputablePercent: history.indicatorComputablePercent,
        historyStaleCount: history.staleCount,
        historyFailedSymbols: history.failedSymbols,
        totalCommonStocks: stockRows.filter((row) => /^\d{4}$/.test(row.symbol) && row.instrumentType === 'stock').length,
        historyComplete250Count: technical?.complete250Count ?? 0,
        technicalIndexCount: technical?.sampleCount ?? 0,
        technicalScoreAvailableCount: technical?.scoreAvailableCount ?? 0,
        decisionJoinCount: screener ? new Set(screener.results.filter((row) => row.decisionScore !== null).map((row) => row.symbol)).size : 0,
        institutionalJoinCount: screener ? new Set(screener.results.filter((row) => row.institutionalNet !== null).map((row) => row.symbol)).size : 0,
        alignedCount: screener ? new Set(screener.results.filter((row) => row.dateAlignmentStatus === 'aligned').map((row) => row.symbol)).size : 0,
        mismatchedCount: screener ? new Set(screener.results.filter((row) => row.dateAlignmentStatus === 'mismatched').map((row) => row.symbol)).size : 0,
        backfillCompleted: backfill?.completedSymbols ?? 0,
        backfillTotal: backfill?.totalSymbols ?? 0,
        backfillStatus: backfill?.status ?? '尚未啟動',
        updatedAt: history.updatedAt ?? institutions.fetchedAt ?? stocks.fetchedAt,
        stale: stocks.stale || institutions.stale || history.staleCount > 0,
      }))
    })
    return () => { active = false }
  }, [])

  if (!report) return <Card><LoadingState rows={6}/></Card>
  const metrics = [
    ['市場官方覆蓋率', report.marketOfficialPercent], ['個股行情官方覆蓋率', report.stockOfficialPercent], ['法人官方覆蓋率', report.institutionalOfficialPercent], ['產業官方覆蓋率', report.industryOfficialPercent],
  ] as const
  const historyMetrics = [
    ['歷史行情股票數', report.historyStockCoverageCount, '檔'], ['平均交易日', report.historyAverageDays, '日'], ['250 日完整率', report.historyComplete250Percent, '%'], ['技術指標可計算率', report.indicatorComputablePercent, '%'],
  ] as const
  const fullMarketMetrics = [
    ['上市普通股總數', report.totalCommonStocks, '檔'], ['已有歷史資料', report.historyStockCoverageCount, '檔'], ['250 日完整', report.historyComplete250Count, '檔'], ['技術索引', report.technicalIndexCount, '檔'], ['Technical Score 可用', report.technicalScoreAvailableCount, '檔'], ['Decision 可合併', report.decisionJoinCount, '檔'], ['法人可合併', report.institutionalJoinCount, '檔'], ['日期 aligned', report.alignedCount, '檔'], ['日期 mismatched', report.mismatchedCount, '檔'], ['Backfill 進度', `${report.backfillCompleted}/${report.backfillTotal}`, report.backfillStatus],
  ] as const
  return <div className="space-y-6">
    <SectionHeader eyebrow="BETA DATA COVERAGE" title="資料覆蓋率" description="逐項揭露 official、derived、mock、fallback、stale 與 missing，避免把規則推導誤認為官方欄位。"/>
    <DataTrustBanner sources={['official', 'derived', 'mock']} stale={report.stale}/>
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value]) => <Card key={label}><div className="p-5"><div className="flex items-center justify-between"><Database size={18} className="text-brand-300"/><Badge tone={value === 100 ? 'brand' : value ? 'warning' : 'neutral'}>{value === 100 ? 'Official' : value ? 'Mixed' : 'Missing'}</Badge></div><p className="mono mt-5 text-3xl text-white">{value}%</p><p className="mt-2 text-sm text-slate-400">{label}</p></div></Card>)}</section>
    <Card title="TWSE 官方歷史行情覆蓋" eyebrow="HISTORICAL PRICE FOUNDATION" action={<Badge tone="info">TWSE Official History</Badge>}>
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-4">{historyMetrics.map(([label, value, unit]) => <div key={label} className="rounded-xl border border-white/[.06] p-4"><CalendarDays size={16} className="text-brand-300"/><p className="mono mt-3 text-2xl text-white">{value}<span className="ml-1 text-xs text-slate-500">{unit}</span></p><p className="mt-2 text-xs text-slate-500">{label}</p></div>)}</div>
      <div className="flex flex-wrap gap-4 border-t border-white/[.06] px-5 py-4 text-xs text-slate-500"><span>Stale：{report.historyStaleCount} 檔</span><span>失敗：{report.historyFailedSymbols.length ? report.historyFailedSymbols.join('、') : '無'}</span><span>最後更新：{report.updatedAt ?? '尚未取得'}</span></div>
    </Card>
    <Card title="全市場技術覆蓋進度" eyebrow="FULL-MARKET COVERAGE · ACTUAL SAMPLE ONLY">
      <div className="grid gap-3 p-5 sm:grid-cols-2 xl:grid-cols-5">{fullMarketMetrics.map(([label, value, unit]) => <div key={label} className="rounded-xl border border-white/[.06] p-4"><p className="text-xs text-slate-500">{label}</p><p className="mono mt-2 text-2xl text-white">{value}<span className="ml-1 text-[10px] text-slate-600">{unit}</span></p></div>)}</div>
      <div className="border-t border-white/[.06] p-5"><div className="h-2 overflow-hidden rounded-full bg-white/[.05]"><div className="h-full rounded-full bg-brand-400" style={{ width: `${report.totalCommonStocks ? Math.min(100, report.historyStockCoverageCount / report.totalCommonStocks * 100) : 0}%` }}/></div><p className="mt-2 text-xs text-slate-500">歷史行情覆蓋率 {report.totalCommonStocks ? Math.round(report.historyStockCoverageCount / report.totalCommonStocks * 100) : 0}%；僅描述實際樣本，不宣稱已完成全市場。</p></div>
    </Card>
    <Card title="欄位來源清單" eyebrow="PROVENANCE"><div className="grid gap-5 p-5 lg:grid-cols-3"><FieldList title="Mock" items={report.mockFields}/><FieldList title="Derived" items={report.derivedFields}/><FieldList title="Missing" items={report.missingFields}/></div></Card>
    <Card title="公開測試資料保護" eyebrow="BETA GUARD"><div className="flex gap-3 p-5 text-sm leading-7 text-slate-300"><ShieldCheck className="mt-1 shrink-0 text-brand-300" size={18}/><p>歷史價格來自 TWSE 官方盤後資料；技術指標與訊號由 GULI 固定規則推導，並非官方結論。缺值維持 null，不以模擬數值補齊。</p>{report.stale && <AlertTriangle className="mt-1 shrink-0 text-amber-300" size={18}/>}</div></Card>
  </div>
}

function FieldList({ title, items }: { title: string; items: string[] }) {
  return <section><h3 className="text-sm font-semibold text-white">{title}</h3><ul className="mt-3 space-y-2">{items.length ? items.map((item) => <li key={item} className="rounded-lg border border-white/[.06] px-3 py-2 text-xs text-slate-400">{item}</li>) : <li className="text-xs text-slate-600">無</li>}</ul></section>
}
