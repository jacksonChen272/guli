import type { DataResult } from '../types/api'

const missingValues = new Set(['', '-', '--', '—', 'N/A', 'null', 'undefined'])

export function normalizeNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/,/g, '')
  if (missingValues.has(normalized)) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export function normalizeDate(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const raw = String(value).trim()
  if (missingValues.has(raw)) return null
  const compact = raw.replace(/[.\/]/g, '-').replace(/\s+/g, '')
  const parts = compact.includes('-') ? compact.split('-').map(Number) : compact.length === 7 ? [Number(compact.slice(0, 3)), Number(compact.slice(3, 5)), Number(compact.slice(5, 7))] : compact.length === 8 ? [Number(compact.slice(0, 4)), Number(compact.slice(4, 6)), Number(compact.slice(6, 8))] : []
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
  let [year, month, day] = parts
  if (year < 1911) year += 1911
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function normalizeStockSymbol(value: unknown): string | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const symbol = String(value).trim().toUpperCase()
  return /^\d{4,6}$/.test(symbol) ? symbol : null
}

export function createDataResult<T>(data: T, options: { source: string; updatedAt: string; warnings?: string[]; stale?: boolean; error?: boolean }): DataResult<T> {
  const isEmpty = Array.isArray(data) ? data.length === 0 : data === null || data === undefined
  return { data, source: options.source, updatedAt: options.updatedAt, status: options.error ? 'error' : options.stale ? 'stale' : isEmpty ? 'empty' : 'success', warnings: options.warnings ?? [] }
}
