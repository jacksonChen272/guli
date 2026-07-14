import ReactECharts from 'echarts-for-react'
import { echarts } from '../../lib/echarts'
import { useMemo } from 'react'
import type { HealthFactor } from '../../types/insight'

export function HealthRadarChart({ factors }: { factors: HealthFactor[] }) {
  const option = useMemo(() => ({ animationDuration: 260, tooltip: { trigger: 'item', backgroundColor: '#11191e', borderColor: '#27343b', textStyle: { color: '#dce5e2', fontSize: 11 } }, legend: { bottom: 0, textStyle: { color: '#77858d', fontSize: 10 }, data: ['個股分數', '產業平均'] }, radar: { center: ['50%', '46%'], radius: '62%', splitNumber: 4, indicator: factors.map((factor) => ({ name: factor.label, max: 100 })), axisName: { color: '#89969d', fontSize: 10 }, splitLine: { lineStyle: { color: 'rgba(255,255,255,.07)' } }, splitArea: { areaStyle: { color: ['rgba(255,255,255,.01)', 'rgba(255,255,255,.025)'] } }, axisLine: { lineStyle: { color: 'rgba(255,255,255,.08)' } } }, series: [{ type: 'radar', symbolSize: 5, data: [{ name: '個股分數', value: factors.map((factor) => factor.score), lineStyle: { color: '#53d9b2' }, itemStyle: { color: '#53d9b2' }, areaStyle: { color: 'rgba(83,217,178,.18)' } }, { name: '產業平均', value: factors.map((factor) => factor.industryAverage), lineStyle: { color: '#4c9ee8', type: 'dashed' }, itemStyle: { color: '#4c9ee8' }, areaStyle: { color: 'rgba(76,158,232,.05)' } }] }] }), [factors])
  return <ReactECharts echarts={echarts} option={option} style={{ height: 300 }} opts={{ renderer: 'canvas' }}/>
}
