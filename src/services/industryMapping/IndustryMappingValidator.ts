import type { OfficialIndustryMappingDataset } from '../../types/officialIndustryMapping'
import { TWSE_INDUSTRY_NAMES } from './IndustryMappingNormalizer'

const datePattern = /^\d{4}-\d{2}-\d{2}$/
const chinesePattern = /[\u3400-\u9fff]/

export interface IndustryMappingValidationResult { valid: boolean; errors: string[]; warnings: string[] }

export function validateIndustryMappingDataset(dataset: OfficialIndustryMappingDataset, universeSymbols?: ReadonlySet<string>): IndustryMappingValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  if (dataset.schemaVersion !== '1.0') errors.push('schemaVersion 必須為 1.0')
  if (dataset.market !== 'TWSE' || dataset.source !== 'TWSE') errors.push('來源必須是 TWSE 官方資料')
  if (!/^https:\/\/(openapi|mopsfin)\.twse\.com\.tw\//.test(dataset.sourceUrl)) errors.push('sourceUrl 必須是 TWSE 官方網域')
  if (!datePattern.test(dataset.effectiveDate) || !Number.isFinite(Date.parse(`${dataset.effectiveDate}T00:00:00Z`))) errors.push('effectiveDate 無效')
  if (!Number.isFinite(Date.parse(dataset.fetchedAt))) errors.push('fetchedAt 無效')
  if (!Array.isArray(dataset.stocks) || !Array.isArray(dataset.industries)) errors.push('stocks 與 industries 必須為陣列')
  if (dataset.stockRecords !== dataset.stocks.length) errors.push('stockRecords 與 stocks 長度不一致')
  if (dataset.mappedStockCount + dataset.unmappedStockCount !== dataset.stockRecords) errors.push('mapped 與 unmapped 合計不一致')
  if (dataset.totalRecords < 0 || dataset.excludedRecords < 0) errors.push('資料筆數不可為負數')
  const symbols = new Set<string>()
  for (const stock of dataset.stocks) {
    if (!/^\d{4}$/.test(stock.symbol)) errors.push(`股票代號無效：${stock.symbol}`)
    if (symbols.has(stock.symbol)) errors.push(`股票代號重複：${stock.symbol}`)
    symbols.add(stock.symbol)
    if (!stock.name || stock.name.includes('\uFFFD')) errors.push(`${stock.symbol} 股票名稱無效`)
    if (stock.instrumentType !== 'stock' || stock.market !== 'TWSE') errors.push(`${stock.symbol} 非上市普通股`)
    if (universeSymbols && !universeSymbols.has(stock.symbol)) errors.push(`${stock.symbol} 不在正式普通股 universe`)
    if (stock.status === 'official') {
      if (!stock.industryCode || !/^\d{2}$/.test(stock.industryCode)) errors.push(`${stock.symbol} 產業代碼無效`)
      if (!stock.industryName || !chinesePattern.test(stock.industryName)) errors.push(`${stock.symbol} 產業名稱缺少可辨識中文`)
      if (stock.industryCode && TWSE_INDUSTRY_NAMES[stock.industryCode] !== stock.industryName) errors.push(`${stock.symbol} 產業代碼與名稱衝突`)
    } else if (stock.industryCode !== null || stock.industryName !== null) errors.push(`${stock.symbol} missing 狀態必須保留 null`)
    if (stock.source !== 'TWSE') errors.push(`${stock.symbol} 不得偽裝官方來源`)
  }
  if (symbols.size < 100) warnings.push('普通股資料筆數異常偏低')
  if (dataset.unmappedStockCount > 0) warnings.push('部分普通股尚未取得官方產業分類')
  return { valid: errors.length === 0, errors, warnings }
}

export function isIndustryMappingStale(effectiveDate: string, now = new Date(), maxCalendarDays = 45) {
  if (!datePattern.test(effectiveDate)) return true
  const date = new Date(`${effectiveDate}T00:00:00Z`)
  return (Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - date.getTime()) / 86_400_000 > maxCalendarDays
}
