import type { MarketSnapshot } from '../types/snapshot'
export interface SnapshotValidationResult { valid: boolean; errors: string[]; warnings: string[] }
export function validateMarketSnapshot(value: unknown): SnapshotValidationResult {
  const errors: string[] = []; const warnings: string[] = []
  if (!value || typeof value !== 'object') return { valid: false, errors: ['Snapshot 必須是物件。'], warnings }
  const snapshot = value as Partial<MarketSnapshot>
  if (snapshot.schemaVersion !== '1.0') errors.push('Snapshot schemaVersion 必須為 1.0。')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.tradeDate ?? '')) errors.push('Snapshot tradeDate 格式無效。')
  if (!Number.isFinite(snapshot.marketTemperature) || Number(snapshot.marketTemperature) < 0 || Number(snapshot.marketTemperature) > 100) errors.push('市場溫度必須介於 0–100。')
  if (!Number.isFinite(snapshot.confidence) || Number(snapshot.confidence) < 0 || Number(snapshot.confidence) > 100) errors.push('信心程度必須介於 0–100。')
  if (typeof snapshot.generatedAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(snapshot.generatedAt) || !Number.isFinite(Date.parse(snapshot.generatedAt))) errors.push('generatedAt 必須是有效 ISO 時間。')
  if (!Array.isArray(snapshot.sources) || snapshot.sources.length === 0) errors.push('Snapshot sources 不可為空。')
  const top = snapshot.topIndustries?.map((item) => item.name) ?? []; const weak = snapshot.weakIndustries?.map((item) => item.name) ?? []
  if (new Set(top).size !== top.length) errors.push('強勢產業不可重複。')
  if (new Set(weak).size !== weak.length) errors.push('弱勢產業不可重複。')
  if (top.some((name) => weak.includes(name))) errors.push('同一產業不可同時出現在強弱榜。')
  const official = snapshot.sources?.find((source) => source.type === 'official')
  if (!official) warnings.push('Snapshot 缺少官方資料來源。')
  if (official?.tradeDate && snapshot.tradeDate && snapshot.tradeDate > official.tradeDate) errors.push('Snapshot 交易日期不得晚於官方來源交易日期。')
  if (!Array.isArray(snapshot.warnings)) errors.push('Snapshot warnings 必須是陣列。')
  return { valid: errors.length === 0, errors, warnings }
}
