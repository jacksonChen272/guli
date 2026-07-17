import type { DateAlignmentResult, DateSourceRecord } from '../../types/screener'

const validDate = (value: string | null): value is string => Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)))

export function tradingDayDistance(left: string, right: string) {
  const start = new Date(`${left < right ? left : right}T00:00:00Z`)
  const end = new Date(`${left < right ? right : left}T00:00:00Z`)
  let days = 0
  for (const cursor = new Date(start); cursor < end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    cursor.setUTCHours(0, 0, 0, 0)
    const next = new Date(cursor); next.setUTCDate(next.getUTCDate() + 1)
    if (next.getUTCDay() !== 0 && next.getUTCDay() !== 6) days += 1
  }
  return days
}

export function alignDataDates(records: DateSourceRecord[]): DateAlignmentResult {
  const missing = records.filter((record) => !validDate(record.tradeDate))
  if (missing.length) return { status: 'missing', referenceDate: null, maxTradingDayGap: null, confidencePenalty: 25, reasons: [`缺少資料日期：${missing.map((item) => item.id).join('、')}`] }
  const dates = records.map((record) => record.tradeDate as string).sort()
  const referenceDate = dates.at(-1) ?? null
  const gaps = referenceDate ? dates.map((date) => tradingDayDistance(date, referenceDate)) : []
  const maxTradingDayGap = gaps.length ? Math.max(...gaps) : 0
  if (maxTradingDayGap === 0) return { status: 'aligned', referenceDate, maxTradingDayGap, confidencePenalty: 0, reasons: ['所有資料來源為同一交易日。'] }
  if (maxTradingDayGap === 1) return { status: 'acceptable', referenceDate, maxTradingDayGap, confidencePenalty: 8, reasons: ['資料來源相差一個交易日，仍在允許範圍內。'] }
  return { status: 'mismatched', referenceDate, maxTradingDayGap, confidencePenalty: 20, reasons: [`資料來源最多相差 ${maxTradingDayGap} 個交易日。`] }
}
