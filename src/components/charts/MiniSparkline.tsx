import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import type { PricePoint } from '../../types/market'

export function MiniSparkline({ data, positive }: { data: PricePoint[]; positive: boolean }) {
  const color = positive ? '#fb7185' : '#34d399'
  const option = useMemo(() => ({
    animation: false,
    grid: { left: 0, right: 0, top: 4, bottom: 0 },
    xAxis: { type: 'category', show: false, data: data.map((item) => item.date) },
    yAxis: { type: 'value', show: false, scale: true },
    series: [{
      type: 'line', data: data.map((item) => item.value), smooth: .35, symbol: 'none',
      lineStyle: { color, width: 1.8 },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: `${color}35` }, { offset: 1, color: `${color}00` }] } },
    }],
    tooltip: { show: false },
  }), [color, data])
  return <ReactECharts option={option} style={{ height: 42, width: 100 }} opts={{ renderer: 'canvas' }} />
}
