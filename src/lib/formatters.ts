const unavailable = '—'

export function formatDecisionScore(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? unavailable : value.toFixed(1)
}

export function formatConfidence(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? unavailable : `${Math.round(value)}%`
}

export function formatWholeScore(value: number | null | undefined) {
  return value === null || value === undefined || !Number.isFinite(value) ? unavailable : Math.round(value).toString()
}

export function formatStockPrice(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return unavailable
  const decimals = value >= 1000 ? 0 : value >= 100 ? 1 : 2
  return value.toLocaleString('zh-TW', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}

export function formatAmount(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return unavailable
  const absolute = Math.abs(value)
  if (absolute >= 100_000_000) return `${(value / 100_000_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 億`
  if (absolute >= 10_000) return `${(value / 10_000).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬`
  return value.toLocaleString('zh-TW')
}

export function formatSignedChange(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || !Number.isFinite(value)) return unavailable
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}${suffix}`
}

export function formatDate(value: string | null | undefined) {
  if (!value) return unavailable
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) return `${match[1]}/${match[2]}/${match[3]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' })
}

export function formatTime(value: string | null | undefined) {
  if (!value) return unavailable
  const timeOnly = value.match(/^(\d{2}):(\d{2})/)
  if (timeOnly) return `${timeOnly[1]}:${timeOnly[2]}`
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return unavailable
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${formatDate(value)} ${formatTime(value)}`
}

export function formatComparison(value: number | null | undefined, suffix = '') {
  if (value === null || value === undefined || !Number.isFinite(value)) return '尚無前期資料'
  const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→'
  return `${arrow} ${formatSignedChange(value, suffix)}`
}
