import { GitBranch, MessageCircle } from 'lucide-react'
import { useState } from 'react'
import { formulaVersion } from '../../config/decisionFormula'
import { repositoryHub } from '../../repositories/RepositoryHub'
import type { DecisionResult } from '../../types/decision'
import type { WatchlistDashboardRow } from '../../types/watchlistDashboard'
import type { ScreenerPresetId } from '../../types/screener'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'

const questions = ['今天市場決策偏多還是偏空？', '2330 決策分數與主要原因？', '我的自選股決策整體如何？', '我的自選股有哪些需要注意？', '哪一檔 Decision 提升最多？', '哪一檔風險最高？', '哪一檔 Confidence 最低？', '今天哪些股票值得觀察？', '哪些產業決策最強？', '哪些個股決策分數最高？', '目前資料信心程度如何？'] as const
interface AnswerState { text: string; decision: DecisionResult | null; source: string; formula: string }
const screenerQuestions = ['今天有哪些強勢趨勢股？', '哪些股票出現量價突破？', '哪些股票 MACD 黃金交叉？', '哪些股票法人與技術同步？', '哪些股票風險最高？', '為什麼這檔股票入選？', '今天資料完整度如何？'] as const
const screenerQuestionPreset: Partial<Record<(typeof screenerQuestions)[number], ScreenerPresetId>> = { '今天有哪些強勢趨勢股？': 'strong-trend', '哪些股票出現量價突破？': 'breakout-volume', '哪些股票 MACD 黃金交叉？': 'macd-golden-cross', '哪些股票法人與技術同步？': 'institution-technical', '哪些股票風險最高？': 'high-risk-warning' }
const traceNote = (decision: DecisionResult) => `可用權重 ${(decision.trace.availableWeight * 100).toFixed(0)}%；${decision.trace.normalizationApplied ? '已套用缺值權重正規化' : '使用完整權重'}。`
const mainFactor = (decision: DecisionResult) => [...decision.factors].filter((factor) => factor.contribution !== null).sort((a, b) => Math.abs(b.contribution!) - Math.abs(a.contribution!))[0]
const rowReference = (row: WatchlistDashboardRow) => `${row.symbol} ${row.name}：Decision ${row.decisionScore?.toFixed(1) ?? '資料不足'}、Confidence ${row.confidence}%、風險 ${row.riskScore}。${traceNote(row.decision)}`

export function DecisionGubaoPanel() {
  const [selected, setSelected] = useState<string>('')
  const [answer, setAnswer] = useState<AnswerState>({ text: '請選擇一個問題。回答會引用 DecisionRepository，或以其 DecisionResult 為核心的 WatchlistDashboardRepository。', decision: null, source: 'DecisionRepository', formula: formulaVersion })
  const [loading, setLoading] = useState(false)
  const reply = (text: string, decision: DecisionResult | null = null, source = 'DecisionRepository') => setAnswer({ text, decision, source, formula: decision?.trace.formulaVersion ?? formulaVersion })
  const ask = async (question: string) => {
    setSelected(question); setLoading(true)
    try {
      if (screenerQuestions.includes(question as (typeof screenerQuestions)[number])) {
        const dataset = await repositoryHub.screener.getDataset()
        const presetId = screenerQuestionPreset[question as (typeof screenerQuestions)[number]]
        if (question === '今天資料完整度如何？') {
          reply(`技術索引目前涵蓋 ${dataset.sampleCount} 檔，其中 ${dataset.complete250Count} 檔具備至少 250 個交易日；資料日 ${dataset.tradeDate ?? '尚未取得'}。目前樣本不代表全市場。`, null, 'ScreenerRepository → Technical Index')
        } else {
          const targetPreset = presetId ?? 'strong-trend'
          const rows = dataset.results.filter((row) => row.presetId === targetPreset && row.matched).sort((a, b) => a.rank - b.rank).slice(0, 5)
          if (question === '為什麼這檔股票入選？') {
            const row = rows[0]
            reply(row ? `${row.symbol} ${row.name}：${row.reasons.slice(0, 3).join('；')}。風險：${row.risks.join('；') || '未觸發額外高風險規則'}。` : '目前實際覆蓋樣本沒有符合強勢趨勢規則的股票。', null, 'ScreenerRepository → Technical Index → Decision / Institutional Repository')
          } else {
            reply(rows.length ? rows.map((row) => `${row.symbol} ${row.name}（Technical ${row.technicalScore?.toFixed(1) ?? '—'}、Confidence ${row.confidence}%）`).join('；') : '目前實際覆蓋樣本沒有符合此固定規則的股票。', null, 'ScreenerRepository → Technical Index → Decision / Institutional Repository')
          }
        }
      } else if (question === '我的自選股有哪些需要注意？') {
        const data = await repositoryHub.watchlistDashboard.getDashboard(); const rows = data.alerts.slice(0, 3).map((alert) => data.rows.find((row) => row.symbol === alert.symbol)).filter((row): row is WatchlistDashboardRow => Boolean(row)); reply(rows.length ? `${data.alerts.slice(0, 3).map((alert) => `${alert.symbol} ${alert.title}`).join('；')}。${rows.map(rowReference).join(' ')}` : '目前沒有觸發規則型提醒的自選股。', rows[0]?.decision ?? null, 'WatchlistDashboardRepository → DecisionRepository')
      } else if (question === '哪一檔 Decision 提升最多？') {
        const data = await repositoryHub.watchlistDashboard.getDashboard(); const row = [...data.rows].filter((item) => item.decisionChange !== null).sort((a, b) => (b.decisionChange ?? -Infinity) - (a.decisionChange ?? -Infinity))[0]; reply(row ? `${row.symbol} ${row.name} 的 Decision 提升最多，變化 ${row.decisionChange! > 0 ? '+' : ''}${row.decisionChange!.toFixed(1)}。${rowReference(row)}` : '目前只有一個 Snapshot 交易日，尚無前期資料可計算提升幅度。', row?.decision ?? null, 'WatchlistDashboardRepository → DecisionRepository')
      } else if (question === '哪一檔風險最高？') {
        const data = await repositoryHub.watchlistDashboard.getDashboard(); const row = data.riskRanking[0]; reply(row ? `${row.symbol} ${row.name} 目前風險分數最高，主要扣分因子為「${row.topNegativeFactors[0]?.name ?? row.risks[0]?.title ?? '風險項目累積'}」。${rowReference(row)}` : '目前沒有可用的自選股 DecisionResult。', row?.decision ?? null, 'WatchlistDashboardRepository → DecisionRepository')
      } else if (question === '哪一檔 Confidence 最低？') {
        const data = await repositoryHub.watchlistDashboard.getDashboard(); const row = [...data.rows].sort((a, b) => a.confidence - b.confidence)[0]; reply(row ? `${row.symbol} ${row.name} 的 Confidence 最低。${rowReference(row)}` : '目前沒有可用的自選股 DecisionResult。', row?.decision ?? null, 'WatchlistDashboardRepository → DecisionRepository')
      } else if (question === '今天哪些股票值得觀察？') {
        const data = await repositoryHub.watchlistDashboard.getDashboard(); const rows = data.actions.filter((action) => action.kind === 'observe').slice(0, 3).map((action) => data.rows.find((row) => row.symbol === action.symbol)).filter((row): row is WatchlistDashboardRow => Boolean(row)); reply(rows.length ? rows.map(rowReference).join(' ') : '今日沒有股票觸發「值得觀察」規則；這不代表股票好壞或買賣建議。', rows[0]?.decision ?? null, 'WatchlistDashboardRepository → DecisionRepository')
      } else if (question.startsWith('今天市場')) {
        const decision = await repositoryHub.decisions.getMarketDecision(); reply(`市場決策為「${decision.label}」，分數 ${decision.score?.toFixed(1) ?? '資料不足'}。${decision.summary} ${traceNote(decision)}`, decision)
      } else if (question.startsWith('2330')) {
        const decision = await repositoryHub.decisions.getStockDecision('2330'); const factor = mainFactor(decision); reply(`2330 決策標籤為「${decision.label}」，主要因子是「${factor?.name ?? '資料不足'}」，貢獻 ${factor?.contribution?.toFixed(2) ?? '—'}。${traceNote(decision)}`, decision)
      } else if (question.includes('整體')) {
        const decision = await repositoryHub.decisions.getWatchlistDecision(); reply(`自選股整體標籤為「${decision.label}」。${decision.summary} ${traceNote(decision)}`, decision)
      } else if (question.includes('產業')) {
        const latest = await repositoryHub.industrySnapshots.getLatest(); const rows = await Promise.all(latest.industries.map((item) => repositoryHub.decisions.getIndustryDecision(item.industryId))); rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1)); const top = rows.slice(0, 3); reply(`${top.map((item) => `${item.entityName} ${item.score?.toFixed(1) ?? '—'} 分`).join('、')}。${top[0] ? traceNote(top[0]) : ''}`, top[0] ?? null)
      } else if (question.includes('個股決策')) {
        const candidates = await repositoryHub.stockSnapshots.getTopStocks('snapshotScore', 10); const rows = await Promise.all(candidates.map((item) => repositoryHub.decisions.getStockDecision(item.symbol))); rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1)); const top = rows.slice(0, 3); reply(`${top.map((item) => `${item.entityId} ${item.entityName} ${item.score?.toFixed(1) ?? '—'} 分`).join('、')}。這是 Decision Score 排序，不是 Stock Snapshot Score 排序。`, top[0] ?? null)
      } else {
        const decision = await repositoryHub.decisions.getMarketDecision(); const missing = decision.factors.filter((factor) => factor.normalizedScore === null && factor.weight > 0).map((factor) => factor.name); reply(`市場決策有 ${decision.warnings.length} 項資料警告；缺值因子：${missing.join('、') || '無'}。${traceNote(decision)}`, decision)
      }
    } catch (cause) { reply(cause instanceof Error ? cause.message : '暫時無法讀取 DecisionResult。') } finally { setLoading(false) }
  }
  return <Card title="股寶 Decision 問答" eyebrow="DECISION REPOSITORY · NO AI API"><div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[.9fr_1.1fr]"><div className="space-y-3">{[...questions, ...screenerQuestions].map((question) => <button key={question} type="button" onClick={() => void ask(question)} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-4 text-left text-sm ${selected === question ? 'border-brand-400/35 bg-brand-400/[.06] text-white' : 'border-white/[.07] text-slate-300 hover:border-white/[.14] hover:text-white'}`}><MessageCircle size={17} className="shrink-0" />{question}</button>)}</div><div className="min-h-[320px] rounded-2xl border border-white/[.07] bg-white/[.018] p-5 sm:p-6"><p className="flex items-center gap-2 text-sm font-medium text-brand-300"><GitBranch size={16} />DecisionResult / DecisionTrace</p>{answer.decision && <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">Decision Score</p><p className="mono mt-2 text-[28px] font-semibold text-white">{answer.decision.score?.toFixed(1) ?? '—'}</p><Badge tone={answer.decision.direction === 'bullish' ? 'up' : answer.decision.direction === 'bearish' ? 'down' : 'neutral'}>{answer.decision.label}</Badge></div><div className="rounded-xl border border-white/[.06] p-4"><p className="text-sm text-slate-400">Confidence</p><p className="mono mt-2 text-[28px] font-semibold text-white">{answer.decision.confidence}%</p><Badge tone="info">可追溯</Badge></div></div>}<p className="mt-5 text-base leading-[1.7] text-slate-200">{loading ? '正在從 Repository 讀取決策…' : answer.text}</p><footer className="mt-6 border-t border-white/[.06] pt-4 text-xs leading-6 text-slate-500"><p>資料來源：{answer.source}</p><p>公式版本：{answer.formula} · 固定規則，未呼叫生成式 AI</p></footer></div></div></Card>
}
