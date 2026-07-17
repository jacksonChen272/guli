import type { OfficialStockHistory, OfficialStockHistoryPrice } from '../../types/officialStockHistory'

export interface StockHistoryValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
  stale: boolean
  missingRatio: number
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const finiteOrNull = (value: number | null) => value === null || Number.isFinite(value)

export function validateHistoryPoint(point: OfficialStockHistoryPrice): string[] {
  const errors: string[] = []
  if (!datePattern.test(point.tradeDate) || Number.isNaN(Date.parse(`${point.tradeDate}T00:00:00Z`))) errors.push('交易日期格式錯誤')
  const numericFields = [point.open, point.high, point.low, point.close, point.change, point.volume, point.tradingAmount, point.transactionCount]
  if (numericFields.some((value) => !finiteOrNull(value))) errors.push('欄位包含非有限數值')
  if ([point.open, point.high, point.low, point.close, point.volume, point.tradingAmount, point.transactionCount].some((value) => value !== null && value < 0)) errors.push('價格、成交量、成交值與筆數不可為負數')
  const { open, high, low, close } = point
  if (open !== null && high !== null && low !== null && close !== null) {
    if (high < Math.max(open, close, low)) errors.push('最高價低於 OHLC 其他價格')
    if (low > Math.min(open, close, high)) errors.push('最低價高於 OHLC 其他價格')
  }
  return errors
}

export function isHistoryStale(lastTradeDate: string | null, now = new Date()): boolean {
  if (!lastTradeDate || !datePattern.test(lastTradeDate)) return true
  const last = new Date(`${lastTradeDate}T00:00:00Z`)
  const elapsedDays = Math.floor((now.getTime() - last.getTime()) / 86_400_000)
  return elapsedDays > 5
}

export function validateOfficialStockHistory(dataset: OfficialStockHistory, now = new Date()): StockHistoryValidationResult {
  const errors: string[] = []
  const warnings = [...dataset.warnings]
  if (!/^\d{4}$/.test(dataset.symbol)) errors.push('股票代號必須為四位數')
  if (!dataset.name.trim()) errors.push('股票名稱不可為空白')
  if (dataset.market !== 'TWSE' || dataset.source !== 'TWSE') errors.push('資料來源必須為 TWSE')
  if (!dataset.sourceUrl.startsWith('https://www.twse.com.tw/')) errors.push('來源網址不是 TWSE 官方網域')
  if (Number.isNaN(Date.parse(dataset.fetchedAt))) errors.push('抓取時間不是有效 ISO 日期')
  if (dataset.recordCount !== dataset.prices.length) errors.push('recordCount 與 prices 筆數不一致')
  const dates = new Set<string>()
  dataset.prices.forEach((point) => {
    validateHistoryPoint(point).forEach((error) => errors.push(`${point.tradeDate}: ${error}`))
    if (dates.has(point.tradeDate)) errors.push(`${point.tradeDate}: 交易日期重複`)
    dates.add(point.tradeDate)
  })
  for (let index = 1; index < dataset.prices.length; index += 1) {
    if (dataset.prices[index - 1].tradeDate >= dataset.prices[index].tradeDate) errors.push('交易日期必須遞增且不可重複')
  }
  const missingCells = dataset.prices.reduce((count, point) => count + [point.open, point.high, point.low, point.close, point.volume].filter((value) => value === null).length, 0)
  const missingRatio = dataset.prices.length ? missingCells / (dataset.prices.length * 5) : 1
  if (missingRatio > 0.05) warnings.push(`核心欄位缺值率 ${(missingRatio * 100).toFixed(1)}%`)
  const stale = isHistoryStale(dataset.lastTradeDate, now)
  if (stale) warnings.push('歷史行情最後交易日可能已過期')
  return { valid: errors.length === 0, warnings: [...new Set(warnings)], errors, stale, missingRatio }
}
