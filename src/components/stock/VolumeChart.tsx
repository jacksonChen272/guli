import ReactECharts from 'echarts-for-react'
import { echarts } from '../../lib/echarts'
import { useMemo } from 'react'
import type { Stock } from '../../types/stock'

export function VolumeChart({ stock, days }: { stock: Stock; days: number }) {
  const option = useMemo(() => { const data = stock.priceHistory.slice(-days); const avg = data.reduce((sum, item) => sum + (item.volume ?? 0), 0) / data.length; return { tooltip: { trigger: 'axis', backgroundColor: '#11191e', borderColor: '#27343b', textStyle: { color: '#dce5e2', fontSize: 10 } }, grid: { left: 50, right: 16, top: 24, bottom: 32 }, xAxis: { type: 'category', data: data.map((point) => point.date.slice(5)), axisLabel: { color: '#66737a', fontSize: 8 }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } } }, yAxis: { type: 'value', axisLabel: { color: '#66737a', fontSize: 8, formatter: (value: number) => `${Math.round(value / 1000)}K` }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.04)' } } }, dataZoom: [{ type: 'inside' }], series: [{ type: 'bar', name: '成交量', data: data.map((point, index) => ({ value: point.volume, itemStyle: { color: index && point.value >= data[index - 1].value ? '#ff7287' : '#53d9b2', opacity: .75 } })), markLine: { silent: true, symbol: 'none', label: { formatter: '區間均量', color: '#748087', fontSize: 9 }, lineStyle: { color: '#4c9ee8', type: 'dashed' }, data: [{ yAxis: avg }] } }] } }, [stock, days])
  return <ReactECharts echarts={echarts} option={option} style={{ height: 280 }} opts={{ renderer: 'canvas' }}/>
}
