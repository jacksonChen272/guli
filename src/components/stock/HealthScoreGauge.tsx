import type { StockHealthResult } from '../../types/insight'

export function HealthScoreGauge({ health }: { health: StockHealthResult }) {
  const angle = -90 + health.totalScore * 1.8
  const color = health.totalScore >= 66 ? '#ff7287' : health.totalScore >= 51 ? '#f6b94a' : '#53d9b2'
  return <div className="relative mx-auto w-full max-w-[300px]" role="img" aria-label={`健康總分 ${health.totalScore}，${health.grade}`}>
    <svg viewBox="0 0 240 142" className="w-full overflow-visible"><path d="M24 120a96 96 0 0 1 192 0" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="17" strokeLinecap="round" /><path d="M24 120a96 96 0 0 1 192 0" fill="none" stroke={color} strokeOpacity=".82" strokeWidth="17" strokeLinecap="round" pathLength="100" strokeDasharray={`${health.totalScore} 100`} /><g transform={`rotate(${angle} 120 120)`}><line x1="120" y1="120" x2="120" y2="39" stroke="#edf2f0" strokeWidth="3" strokeLinecap="round" /><circle cx="120" cy="120" r="7" fill="#edf2f0" /></g></svg>
    <div className="absolute inset-x-0 bottom-0 text-center"><p className="mono text-4xl font-semibold text-white">{health.totalScore}</p><p className="mt-1 text-sm font-medium" style={{ color }}>{health.grade}</p><p className="mt-1 text-xs text-slate-500">滿分 100</p></div>
  </div>
}
