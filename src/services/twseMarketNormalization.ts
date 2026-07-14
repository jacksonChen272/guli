import type { OfficialMarketOverview } from '../types/marketData'
import { normalizeDate, normalizeNumber } from './dataNormalizationService'

export const TWSE_SOURCE = '臺灣證券交易所（TWSE）'
export const TWSE_MARKET_ENDPOINTS = [
  'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX',
  'https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK',
  'https://openapi.twse.com.tw/v1/opendata/twtazu_od',
]

type RawRecord = Record<string, unknown>
export interface TWSEMarketRawInput {
  index: RawRecord
  trading: RawRecord
  breadth?: RawRecord | null
  fetchedAt: string
}

const read = (record: RawRecord | null | undefined, keys: string[]) => {
  for (const key of keys) if (record && record[key] !== undefined) return record[key]
  return undefined
}

const signedNumber = (value: unknown, sign: unknown) => {
  const number = normalizeNumber(value)
  if (number === null) return null
  return String(sign ?? '').trim() === '-' ? -Math.abs(number) : number
}

const count = (record: RawRecord | null | undefined, keys: string[]) => {
  const value = normalizeNumber(read(record, keys))
  return value === null ? null : Math.trunc(value)
}

export function normalizeTWSEMarketOverview(input: TWSEMarketRawInput): OfficialMarketOverview {
  const tradeDate = normalizeDate(read(input.index, ['日期', 'Date'])) ?? normalizeDate(read(input.trading, ['Date', '日期'])) ?? ''
  const tradingDate = normalizeDate(read(input.trading, ['Date', '日期']))
  const breadthDate = normalizeDate(read(input.breadth, ['出表日期', '日期', 'Date']))
  const warnings: string[] = []
  const indexValue = normalizeNumber(read(input.index, ['收盤指數', 'TAIEX', '指數值'])) ?? Number.NaN
  const change = signedNumber(read(input.index, ['漲跌點數', 'Change', '漲跌']), read(input.index, ['漲跌', '漲跌符號'])) ?? Number.NaN
  const rawPercent = signedNumber(read(input.index, ['漲跌百分比', 'ChangePercent', '漲跌幅']), read(input.index, ['漲跌', '漲跌符號']))
  const previousValue = Number.isFinite(indexValue) && Number.isFinite(change) ? indexValue - change : Number.NaN
  const changePercent = rawPercent ?? (Number.isFinite(previousValue) && previousValue !== 0 ? change / previousValue * 100 : Number.NaN)
  const tradingAmount = normalizeNumber(read(input.trading, ['TradeValue', '成交金額', '成交值'])) ?? Number.NaN
  const breadthMatches = Boolean(input.breadth && breadthDate && breadthDate === tradeDate)
  if (tradingDate && tradeDate && tradingDate !== tradeDate) warnings.push('指數與成交金額的交易日期不一致。')
  if (input.breadth && !breadthMatches) warnings.push('漲跌家數資料與指數交易日期不一致，已保留為缺值。')
  const advanceCount = breadthMatches ? count(input.breadth, ['上漲', 'Advance', '上漲家數']) : null
  const declineCount = breadthMatches ? count(input.breadth, ['下跌', 'Decline', '下跌家數']) : null
  const unchangedCount = breadthMatches ? count(input.breadth, ['持平', '平盤', 'Unchanged', '平盤家數']) : null
  if ([advanceCount, declineCount, unchangedCount].some((value) => value === null)) warnings.push('TWSE 官方資料缺少完整漲跌家數，本筆資料為部分資料。')
  return {
    market: 'TWSE', tradeDate, indexName: String(read(input.index, ['指數', 'IndexName']) ?? '發行量加權股價指數'),
    indexValue, change, changePercent, tradingAmount, advanceCount, declineCount, unchangedCount,
    source: TWSE_SOURCE, sourceUrl: TWSE_MARKET_ENDPOINTS.join(' | '), fetchedAt: input.fetchedAt,
    status: warnings.length ? 'partial' : 'official', warnings,
  }
}

export const toHundredMillionTWD = (amountInTwd: number) => amountInTwd / 100_000_000
