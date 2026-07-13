import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { useMemo } from 'react'
import { mockIndustries } from '../../data/mockIndustries'
import { industryRotationPoints, stockRotationPoints } from '../../data/mockRotation'
import { mockStocks } from '../../data/mockStocks'
import type { InstitutionType, MarketBoard, Period, RotationMode, RotationPoint } from '../../types/market'

type ChartDatum = { id: string; name: string; industry: string; value: [number, number, number, number, number]; point: RotationPoint; itemStyle: { color: string } }
type ClickParams = { data?: ChartDatum }

const fallbackColors = ['#32e2b0', '#8b7cff', '#f6b94a', '#ff6b81', '#35a7ff', '#5ed5d1', '#c084fc']
const industryColor = new Map(mockIndustries.map((industry) => [industry.name, industry.color]))

export function CapitalRotationChart({ mode, institution, period, board = 'all', industry = 'all', search = '', showTrails = false, dateIndex = 19, compact = false, onSelect }: { mode: RotationMode; institution: InstitutionType; period: Period; board?: MarketBoard; industry?: string; search?: string; showTrails?: boolean; dateIndex?: number; compact?: boolean; onSelect: (point: RotationPoint) => void }) {
  const chartState = useMemo(() => {
    const factor = period / 20
    const institutionKey = institution === 'all' ? 'total' : institution
    const raw = mode === 'stock' ? stockRotationPoints : industryRotationPoints
    const filtered = raw.filter((point) => {
      if (industry !== 'all' && point.industry !== industry) return false
      if (mode === 'stock') {
        const stock = mockStocks.find((item) => item.symbol === point.id)
        if (board !== 'all' && stock?.board !== board) return false
        if (search && !`${point.id}${point.name}`.toLowerCase().includes(search.toLowerCase())) return false
      }
      return true
    })
    const adjusted = filtered.map((point) => {
      const historyPoint = point.history[Math.min(dateIndex, point.history.length - 1)]
      const institutionalBase = point.institutions[institutionKey]
      const institutionalFactor = institution === 'all' ? 1 : Math.max(.35, Math.min(1.8, Math.abs(institutionalBase) / Math.max(Math.abs(point.institutions.total), 1)))
      return { ...point, capitalFlow: Math.round(historyPoint.capitalFlow * factor * institutionalFactor * 10) / 10, momentum: Math.round(historyPoint.momentum * (.75 + factor / 4) * 10) / 10 }
    })
    return { adjusted, factor }
  }, [board, dateIndex, industry, institution, mode, period, search])

  const option = useMemo<EChartsOption>(() => {
    const grouped = new Map<string, RotationPoint[]>()
    chartState.adjusted.forEach((point) => grouped.set(point.industry, [...(grouped.get(point.industry) ?? []), point]))
    const scatterSeries = [...grouped.entries()].map(([name, points], groupIndex) => ({
      name,
      type: 'scatter' as const,
      data: points.map((point): ChartDatum => ({
        id: point.id, name: point.name, industry: point.industry, point,
        value: [point.capitalFlow, point.momentum, Math.abs(point.cumulative20d), point.changePercent, point.healthScore],
        itemStyle: { color: industryColor.get(point.industry) ?? fallbackColors[groupIndex % fallbackColors.length] },
      })),
      symbolSize: (value: number[]) => Math.max(16, Math.min(compact ? 50 : 68, 17 + Math.sqrt(Math.abs(value[2])) * (compact ? 3.1 : 4.2))),
      emphasis: { focus: 'series' as const, scale: 1.15, itemStyle: { shadowBlur: 18, shadowColor: 'rgba(50,226,176,.35)', borderColor: '#fff', borderWidth: 1 } },
      itemStyle: { opacity: .8, borderColor: 'rgba(255,255,255,.3)', borderWidth: 1 },
      animationDurationUpdate: 650,
      animationEasingUpdate: 'cubicOut' as const,
      markLine: groupIndex === 0 ? { silent: true, symbol: 'none', lineStyle: { color: 'rgba(255,255,255,.16)', type: 'dashed' as const, width: 1 }, data: [{ xAxis: 0 }, { yAxis: 0 }], label: { show: false } } : undefined,
    }))
    const trailSeries = showTrails ? chartState.adjusted.slice(0, compact ? 5 : 10).map((point) => ({
      name: `${point.name}軌跡`, type: 'line' as const, silent: true, showSymbol: false, smooth: .25,
      data: point.history.slice(Math.max(0, dateIndex - 4), dateIndex + 1).map((item) => [item.capitalFlow * chartState.factor, item.momentum]),
      lineStyle: { width: 1, opacity: .38, color: industryColor.get(point.industry) },
      tooltip: { show: false },
    })) : []
    return {
      backgroundColor: 'transparent',
      animationDuration: 500,
      grid: { left: compact ? 48 : 64, right: compact ? 26 : 42, top: compact ? 40 : 58, bottom: compact ? 50 : 70 },
      legend: compact ? { show: false } : { type: 'scroll', top: 12, left: 20, right: 20, textStyle: { color: '#87949c', fontSize: 10 }, icon: 'circle', itemWidth: 8, itemHeight: 8, pageTextStyle: { color: '#87949c' } },
      xAxis: { type: 'value', name: '資金流向（億元）', nameLocation: 'middle', nameGap: 34, nameTextStyle: { color: '#66737b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.045)' } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } }, axisLabel: { color: '#66737b', fontSize: 9 } },
      yAxis: { type: 'value', name: '資金動能', nameTextStyle: { color: '#66737b', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.045)' } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.12)' } }, axisLabel: { color: '#66737b', fontSize: 9 } },
      dataZoom: [{ type: 'inside', xAxisIndex: 0, filterMode: 'none', zoomOnMouseWheel: true, moveOnMouseMove: true }, { type: 'inside', yAxisIndex: 0, filterMode: 'none', zoomOnMouseWheel: true, moveOnMouseMove: true }],
      tooltip: { trigger: 'item', confine: true, backgroundColor: 'rgba(9,13,16,.96)', borderColor: 'rgba(255,255,255,.12)', textStyle: { color: '#dbe4e2', fontSize: 11 }, formatter: (raw: unknown) => { const params = raw as { data?: ChartDatum }; const item = params.data; if (!item?.point) return ''; const point = item.point; return `<div style="min-width:180px"><b style="color:#fff">${point.name}</b><span style="color:#66737b;margin-left:8px">${point.industry}</span><div style="margin-top:8px;line-height:1.8;color:#9aa6ad">資金流向　<b style="color:#32e2b0">${point.capitalFlow.toFixed(1)} 億</b><br/>資金動能　${point.momentum.toFixed(1)}<br/>20 日累計　${point.cumulative20d.toFixed(1)} 億<br/>漲跌幅　<b style="color:${point.changePercent >= 0 ? '#fb7185' : '#34d399'}">${point.changePercent > 0 ? '+' : ''}${point.changePercent.toFixed(2)}%</b></div></div>` } },
      graphic: [
        { type: 'text', right: '6%', top: compact ? 26 : 46, style: { text: '加速流入', fill: 'rgba(50,226,176,.35)', fontSize: 11, fontWeight: 600 } },
        { type: 'text', right: '6%', bottom: compact ? 38 : 56, style: { text: '流入放緩', fill: 'rgba(246,185,74,.3)', fontSize: 11 } },
        { type: 'text', left: compact ? 48 : 64, top: compact ? 26 : 46, style: { text: '流出收斂', fill: 'rgba(53,167,255,.3)', fontSize: 11 } },
        { type: 'text', left: compact ? 48 : 64, bottom: compact ? 38 : 56, style: { text: '加速流出', fill: 'rgba(255,107,129,.25)', fontSize: 11 } },
      ],
      series: [...trailSeries, ...scatterSeries],
    }
  }, [chartState, compact, dateIndex, showTrails])

  const events = useMemo(() => ({ click: (params: ClickParams) => { if (params.data?.point) onSelect(params.data.point) } }), [onSelect])
  return <ReactECharts option={option} notMerge lazyUpdate onEvents={events} style={{ height: compact ? 440 : 600, width: '100%' }} opts={{ renderer: 'canvas' }} />
}
