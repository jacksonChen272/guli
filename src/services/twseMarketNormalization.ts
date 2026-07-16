import type {
  OfficialMarketBreadthSource,
  OfficialMarketOverview,
  OfficialMarketRankingItem,
  OfficialMarketRankings,
  OfficialMarketTradingPoint,
} from '../types/marketData'
import { normalizeDate, normalizeNumber } from './dataNormalizationService'

export const TWSE_SOURCE = '臺灣證券交易所（TWSE）'
export const TWSE_MARKET_ENDPOINTS = [
  'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX',
  'https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK',
  'https://openapi.twse.com.tw/v1/opendata/twtazu_od',
  'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
]

type RawRecord = Record<string, unknown>
export interface TWSEMarketRawInput {
  index: RawRecord
  trading: RawRecord | RawRecord[]
  breadth?: RawRecord | null
  stocks?: RawRecord[]
  fetchedAt: string
}

const read = (record: RawRecord | null | undefined, keys: string[]) => {
  for (const key of keys) if (record && record[key] !== undefined) return record[key]
  return undefined
}

const signedNumber = (value: unknown, sign?: unknown) => {
  const parsed = normalizeNumber(value)
  if (parsed === null) return null
  return String(sign ?? '').trim() === '-' ? -Math.abs(parsed) : parsed
}

const count = (record: RawRecord | null | undefined, keys: string[]) => {
  const value = normalizeNumber(read(record, keys))
  return value === null ? null : Math.trunc(value)
}

const percentChange = (close: number, change: number) => {
  const previous = close - change
  return previous > 0 ? change / previous * 100 : 0
}

const compareNumber = (selector: (item: OfficialMarketRankingItem) => number, direction: 'asc' | 'desc') =>
  (left: OfficialMarketRankingItem, right: OfficialMarketRankingItem) => {
    const difference = selector(left) - selector(right)
    return difference === 0 ? left.symbol.localeCompare(right.symbol) : direction === 'asc' ? difference : -difference
  }

const normalizeStock = (row: RawRecord, tradeDate: string): OfficialMarketRankingItem | null => {
  const symbol = String(read(row, ['Code', '證券代號']) ?? '').trim()
  const name = String(read(row, ['Name', '證券名稱']) ?? '').trim()
  const date = normalizeDate(read(row, ['Date', '日期']))
  const close = normalizeNumber(read(row, ['ClosingPrice', '收盤價']))
  const change = signedNumber(read(row, ['Change', '漲跌價差']), read(row, ['漲跌', '漲跌符號']))
  const tradingAmount = normalizeNumber(read(row, ['TradeValue', '成交金額', '成交值']))
  const tradingVolume = normalizeNumber(read(row, ['TradeVolume', '成交股數', '成交量']))
  if (!/^\d{4}$/.test(symbol) || /^00/.test(symbol) || !name || date !== tradeDate || close === null || close <= 0 || change === null
    || tradingAmount === null || tradingAmount < 0 || tradingVolume === null || tradingVolume < 0) return null
  return { symbol, name, close, change, changePercent: percentChange(close, change), tradingAmount, tradingVolume }
}

const createRankings = (stocks: OfficialMarketRankingItem[]): OfficialMarketRankings => ({
  tradingAmount: [...stocks].sort(compareNumber((item) => item.tradingAmount, 'desc')).slice(0, 10),
  tradingVolume: [...stocks].sort(compareNumber((item) => item.tradingVolume, 'desc')).slice(0, 10),
  gainers: stocks.filter((item) => item.changePercent > 0).sort(compareNumber((item) => item.changePercent, 'desc')).slice(0, 10),
  losers: stocks.filter((item) => item.changePercent < 0).sort(compareNumber((item) => item.changePercent, 'asc')).slice(0, 10),
})

const normalizeTradingHistory = (rows: RawRecord[], latestDate: string): OfficialMarketTradingPoint[] => rows
  .map((row): OfficialMarketTradingPoint | null => {
    const tradeDate = normalizeDate(read(row, ['Date', '日期']))
    const indexValue = normalizeNumber(read(row, ['TAIEX', '發行量加權股價指數']))
    const tradingAmount = normalizeNumber(read(row, ['TradeValue', '成交金額', '成交值']))
    const tradingVolume = normalizeNumber(read(row, ['TradeVolume', '成交股數', '成交量']))
    const transactionCount = normalizeNumber(read(row, ['Transaction', '成交筆數']))
    if (!tradeDate || tradeDate > latestDate || indexValue === null || indexValue <= 0 || tradingAmount === null || tradingAmount < 0
      || tradingVolume === null || tradingVolume < 0 || transactionCount === null || transactionCount < 0) return null
    return { tradeDate, indexValue, tradingAmount, tradingVolume, transactionCount }
  })
  .filter((point): point is OfficialMarketTradingPoint => point !== null)
  .sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
  .slice(-20)

export function normalizeTWSEMarketOverview(input: TWSEMarketRawInput): OfficialMarketOverview {
  const tradeDate = normalizeDate(read(input.index, ['日期', 'Date'])) ?? ''
  const tradingRows = Array.isArray(input.trading) ? input.trading : [input.trading]
  const trading = tradingRows.find((row) => normalizeDate(read(row, ['Date', '日期'])) === tradeDate)
  const breadthDate = normalizeDate(read(input.breadth, ['出表日期', '日期', 'Date']))
  const warnings: string[] = []

  const indexValue = normalizeNumber(read(input.index, ['收盤指數', 'TAIEX', '指數值'])) ?? Number.NaN
  const change = signedNumber(read(input.index, ['漲跌點數', 'Change']), read(input.index, ['漲跌', '漲跌符號'])) ?? Number.NaN
  const rawPercent = signedNumber(read(input.index, ['漲跌百分比', 'ChangePercent', '漲跌幅']), read(input.index, ['漲跌', '漲跌符號']))
  const previousValue = Number.isFinite(indexValue) && Number.isFinite(change) ? indexValue - change : Number.NaN
  const changePercent = rawPercent ?? (Number.isFinite(previousValue) && previousValue !== 0 ? change / previousValue * 100 : Number.NaN)
  const tradingAmount = normalizeNumber(read(trading, ['TradeValue', '成交金額', '成交值'])) ?? Number.NaN
  const tradingVolume = normalizeNumber(read(trading, ['TradeVolume', '成交股數', '成交量'])) ?? Number.NaN
  const transactionCount = normalizeNumber(read(trading, ['Transaction', '成交筆數'])) ?? Number.NaN
  const tradingHistory = normalizeTradingHistory(tradingRows, tradeDate)

  const normalizedStocks = (input.stocks ?? []).map((row) => normalizeStock(row, tradeDate)).filter((item): item is OfficialMarketRankingItem => item !== null)
  const rankings = createRankings(normalizedStocks)
  const breadthMatches = Boolean(input.breadth && breadthDate === tradeDate && String(read(input.breadth, ['類型', 'Type']) ?? '') === '股票')
  const breadthSource: OfficialMarketBreadthSource = breadthMatches ? 'twtazu_od' : 'stock_day_all'

  const derivedCounts = {
    advanceCount: normalizedStocks.filter((stock) => stock.change > 0).length,
    declineCount: normalizedStocks.filter((stock) => stock.change < 0).length,
    unchangedCount: normalizedStocks.filter((stock) => stock.change === 0).length,
    limitUpCount: normalizedStocks.filter((stock) => stock.changePercent >= 9.5).length,
    limitDownCount: normalizedStocks.filter((stock) => stock.changePercent <= -9.5).length,
  }
  const officialCounts = {
    advanceCount: count(input.breadth, ['上漲', 'Advance', '上漲家數']),
    declineCount: count(input.breadth, ['下跌', 'Decline', '下跌家數']),
    unchangedCount: count(input.breadth, ['持平', '平盤', 'Unchanged', '平盤家數']),
    limitUpCount: count(input.breadth, ['漲停', 'LimitUp', '漲停家數']),
    limitDownCount: count(input.breadth, ['跌停', 'LimitDown', '跌停家數']),
  }
  const counts = breadthMatches ? officialCounts : normalizedStocks.length ? derivedCounts : {
    advanceCount: null, declineCount: null, unchangedCount: null, limitUpCount: null, limitDownCount: null,
  }

  if (!trading) warnings.push('FMTQIK 找不到與指數相同交易日的市場成交資料。')
  if (!breadthMatches && normalizedStocks.length) warnings.push('twtazu_od 尚未發布同交易日統計；市場廣度由 TWSE STOCK_DAY_ALL 官方股票資料彙整，漲跌停家數依漲跌幅 9.5% 門檻推導。')
  if (!normalizedStocks.length) warnings.push('STOCK_DAY_ALL 缺少同交易日上市股票資料，市場廣度與排行無法產生。')
  if (Object.values(counts).some((value) => value === null)) warnings.push('TWSE 官方市場廣度欄位不完整，缺值保留 null。')
  if (Object.values(rankings).some((items) => items.length < 10)) warnings.push('TWSE 官方個股資料不足，部分排行少於 10 筆。')

  const incomplete = !trading || Object.values(counts).some((value) => value === null) || Object.values(rankings).some((items) => items.length < 10)
  return {
    schemaVersion: '2.0', market: 'TWSE', tradeDate,
    indexName: String(read(input.index, ['指數', 'IndexName']) ?? '發行量加權股價指數'),
    indexValue, change, changePercent, tradingAmount, tradingVolume, transactionCount,
    ...counts, breadthSource, tradingHistory, rankings,
    source: TWSE_SOURCE, sourceUrl: TWSE_MARKET_ENDPOINTS.join(' | '), fetchedAt: input.fetchedAt,
    status: incomplete ? 'partial' : 'official', warnings,
  }
}

export const toHundredMillionTWD = (amountInTwd: number) => amountInTwd / 100_000_000
export const toHundredMillionShares = (volumeInShares: number) => volumeInShares / 100_000_000
