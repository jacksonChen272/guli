import ReactECharts from 'echarts-for-react'
import { Activity, Database, Info } from 'lucide-react'
import { useMemo } from 'react'
import { echarts, type EChartsOption } from '../../lib/echarts'
import type { MarketSentimentResult } from '../../types/dashboardIntelligence'
import { Badge } from '../ui/Badge'
import { Card } from '../ui/Card'
import { LoadingState } from '../ui/LoadingState'

const tone = (score: number | null) => score === null ? 'neutral' : score < 40 ? 'warning' : score >= 60 ? 'brand' : 'info'

export function MarketSentimentGauge({ result, loading }: { result: MarketSentimentResult; loading: boolean }) {
  const option = useMemo<EChartsOption>(() => ({
    animationDuration: 240,
    series: [{
      type: 'gauge', min: 0, max: 100, startAngle: 180, endAngle: 0, center: ['50%', '72%'], radius: '108%',
      progress: { show: true, width: 16, itemStyle: { color: result.score !== null && result.score < 40 ? '#f59e0b' : result.score !== null && result.score >= 60 ? '#48d7b0' : '#6aa8ff' } },
      axisLine: { lineStyle: { width: 16, color: [[0.2, '#42252c'], [0.4, '#4a3824'], [0.6, '#27373d'], [0.8, '#23433c'], [1, '#244b44']] } },
      splitLine: { distance: -22, length: 8, lineStyle: { color: 'rgba(255,255,255,.22)', width: 1 } },
      axisTick: { show: false }, axisLabel: { distance: -42, color: '#738080', fontSize: 10, formatter: (value: number) => value % 20 === 0 ? String(value) : '' },
      pointer: { show: result.score !== null, length: '56%', width: 4, itemStyle: { color: '#dbe7e4' } }, anchor: { show: result.score !== null, size: 9, itemStyle: { color: '#dbe7e4' } },
      title: { show: true, offsetCenter: [0, '15%'], color: '#8fa09d', fontSize: 13 },
      detail: { valueAnimation: true, offsetCenter: [0, '-6%'], color: '#f8fafc', fontFamily: 'monospace', fontSize: 34, fontWeight: 700, formatter: (value: number) => result.score === null ? '—' : value.toFixed(0) },
      data: [{ value: result.score ?? 0, name: result.label }],
    }],
  }), [result])

  return <Card className="h-full min-w-0" title="市場情緒溫度" eyebrow="MARKET SENTIMENT" action={<div className="flex flex-wrap gap-2"><Badge tone={tone(result.score)}>{result.label}</Badge><Badge tone="neutral">market-sentiment-v1</Badge></div>}>
    {loading && result.score === null ? <LoadingState rows={5}/> : <div className="grid min-w-0 gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(260px,.82fr)_minmax(0,1.18fr)] lg:items-center">
      <div className="min-w-0"><div role="img" aria-label={`市場情緒分數 ${result.score ?? '尚未取得'}，${result.label}`}><ReactECharts echarts={echarts} option={option} notMerge lazyUpdate style={{ height: 230, width: '100%' }} opts={{ renderer: 'canvas' }}/></div><p className="text-center text-xs text-slate-500">規則資料完整度 {result.confidence}% · {result.tradeDate ?? '日期尚未取得'}</p></div>
      <div className="min-w-0 space-y-2">{result.factors.map((factor) => <div key={factor.id} className="grid min-h-14 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.015] px-3 py-2.5"><div className="min-w-0"><p className="flex items-center gap-2 text-xs font-medium text-slate-300"><Activity size={13} className="text-brand-300"/>{factor.label}<span className="text-[10px] text-slate-600">{factor.weight}%</span></p><p className="mt-1 truncate text-[11px] text-slate-600" title={factor.explanation}>{factor.explanation}</p></div><div className="text-right"><p className="mono text-sm font-semibold text-white">{factor.score?.toFixed(1) ?? '—'}</p><p className="mt-1 flex items-center justify-end gap-1 text-[9px] uppercase text-slate-600"><Database size={10}/>{factor.sourceType}</p></div></div>)}</div>
    </div>}
    <p className="flex items-start gap-2 border-t border-white/[.06] px-4 py-3 text-xs leading-5 text-slate-600 sm:px-5"><Info size={13} className="mt-0.5 shrink-0"/>情緒分數由官方盤後行情與法人資料，以及既有市場判讀結果依固定權重推導，不代表未來漲跌。</p>
  </Card>
}

