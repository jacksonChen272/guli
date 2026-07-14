import ReactECharts from 'echarts-for-react'
import { echarts } from '../../lib/echarts'
import { useMemo } from 'react'
import type { Stock } from '../../types/stock'

export function InstitutionalChart({ stock, days }: { stock: Stock; days: number }) {
  const option = useMemo(() => { const data = stock.institutionalHistory.slice(-days); return { color: ['#4c9ee8', '#f6b94a', '#a78bfa'], tooltip: { trigger: 'axis', backgroundColor: '#11191e', borderColor: '#27343b', textStyle: { color: '#dce5e2', fontSize: 10 } }, legend: { top: 0, textStyle: { color: '#77858d', fontSize: 9 } }, grid: { left: 50, right: 16, top: 38, bottom: 32 }, xAxis: { type: 'category', data: data.map((point) => point.date.slice(5)), axisLabel: { color: '#66737a', fontSize: 8 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } } }, yAxis: { type: 'value', splitLine: { lineStyle: { color: 'rgba(255,255,255,.04)' } }, axisLabel: { color: '#66737a', fontSize: 8 } }, dataZoom: [{ type: 'inside' }], series: ['foreign', 'trust', 'dealer'].map((key, index) => ({ name: ['外資', '投信', '自營商'][index], type: 'bar', stack: 'flow', data: data.map((point) => point[key as 'foreign' | 'trust' | 'dealer']) })) } }, [stock, days])
  return <ReactECharts echarts={echarts} option={option} style={{ height: 280 }} opts={{ renderer: 'canvas' }}/>
}
