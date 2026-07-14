import ReactECharts from 'echarts-for-react'
import { echarts } from '../../lib/echarts'
import { useMemo } from 'react'
import type { SupportResistanceLevel } from '../../types/insight'
import type { Stock } from '../../types/stock'

export function StockPriceChart({ stock, days, levels }: { stock: Stock; days: number; levels: SupportResistanceLevel[] }) {
  const option = useMemo(() => { const data = stock.priceHistory.slice(-days); return { animationDurationUpdate: 220, grid: { left: 52, right: 20, top: 28, bottom: 36 }, tooltip: { trigger: 'axis', backgroundColor: '#11191e', borderColor: '#27343b', textStyle: { color: '#dce5e2', fontSize: 11 }, formatter: (params: Array<{ axisValue: string; value: number }>) => `${params[0]?.axisValue}<br/>收盤：${Number(params[0]?.value).toLocaleString()}` }, xAxis: { type: 'category', data: data.map((point) => point.date.slice(5)), boundaryGap: false, axisLine: { lineStyle: { color: 'rgba(255,255,255,.08)' } }, axisLabel: { color: '#66737a', fontSize: 9 } }, yAxis: { type: 'value', scale: true, splitLine: { lineStyle: { color: 'rgba(255,255,255,.045)' } }, axisLabel: { color: '#66737a', fontSize: 9 } }, dataZoom: [{ type: 'inside' }], series: [{ name: '收盤價', type: 'line', smooth: .22, showSymbol: false, data: data.map((point) => point.value), lineStyle: { width: 2, color: '#53d9b2' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(83,217,178,.20)' }, { offset: 1, color: 'rgba(83,217,178,0)' }] } }, markLine: { silent: true, symbol: 'none', label: { color: '#8d999f', fontSize: 9, formatter: '{b}' }, data: levels.map((level) => ({ name: `${level.order}${level.type}`, yAxis: level.price, lineStyle: { color: level.type === '支撐' ? '#53d9b2' : '#ff7287', opacity: level.order === 1 ? .65 : .3, type: 'dashed' } })) } }] } }, [stock, days, levels])
  return <ReactECharts echarts={echarts} option={option} style={{ height: 330 }} opts={{ renderer: 'canvas' }}/>
}
