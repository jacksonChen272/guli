import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const PUBLIC_DATA = path.join(process.cwd(), 'public', 'data')
const MAX_JSON_BYTES = 50 * 1024 * 1024
const CONFLICT_PATTERN = /<<<<<<<|=======|>>>>>>>/

export function validateJsonText(text, file = 'unknown.json') {
  const errors = []
  if (!text.trim()) errors.push(`${file}: 檔案為空白`)
  if (CONFLICT_PATTERN.test(text)) errors.push(`${file}: 包含 Git conflict marker`)
  if (text.includes('\uFFFD')) errors.push(`${file}: 包含 Unicode replacement character`)
  let value = null
  try { value = JSON.parse(text) } catch (error) { errors.push(`${file}: JSON.parse 失敗：${error instanceof Error ? error.message : String(error)}`) }
  return { valid: errors.length === 0, errors, value }
}

export function validateStockHistoryDataset(value, file) {
  const errors = []
  if (!value || typeof value !== 'object') return [`${file}: 歷史行情根節點無效`]
  const expectedSymbol = path.basename(file, '.json')
  if (value.symbol !== expectedSymbol) errors.push(`${file}: symbol 與檔名不一致`)
  if (typeof value.name !== 'string' || !value.name.trim()) errors.push(`${file}: name 不可空白`)
  if (typeof value.name === 'string' && (/\uFFFD/.test(value.name) || /\?{3,}/.test(value.name))) errors.push(`${file}: name 含疑似亂碼`)
  if (value.source !== 'TWSE') errors.push(`${file}: source 必須為 TWSE`)
  if (!Number.isFinite(Date.parse(value.fetchedAt))) errors.push(`${file}: fetchedAt 必須為有效 ISO 日期`)
  if (!Array.isArray(value.prices) || !value.prices.length) return [...errors, `${file}: prices 必須為非空陣列`]
  const dates = new Set()
  let previousDate = ''
  for (const point of value.prices) {
    if (!point || typeof point !== 'object' || typeof point.tradeDate !== 'string') { errors.push(`${file}: prices 包含無效項目`); continue }
    if (dates.has(point.tradeDate)) errors.push(`${file}: 重複交易日期 ${point.tradeDate}`)
    if (previousDate && point.tradeDate <= previousDate) errors.push(`${file}: 日期未嚴格升冪 ${point.tradeDate}`)
    dates.add(point.tradeDate); previousDate = point.tradeDate
    for (const field of ['open', 'high', 'low', 'close']) if (point[field] !== null && (!Number.isFinite(point[field]) || point[field] < 0)) errors.push(`${file}: ${point.tradeDate} ${field} 無效`)
    for (const field of ['volume', 'tradingAmount', 'transactionCount']) if (point[field] !== null && (!Number.isFinite(point[field]) || point[field] < 0)) errors.push(`${file}: ${point.tradeDate} ${field} 不可為負`)
    if ([point.open, point.high, point.low, point.close].every((number) => number !== null)) {
      if (point.high < Math.max(point.open, point.close, point.low)) errors.push(`${file}: ${point.tradeDate} high 低於其他 OHLC`)
      if (point.low > Math.min(point.open, point.close, point.high)) errors.push(`${file}: ${point.tradeDate} low 高於其他 OHLC`)
    }
  }
  if (value.recordCount !== value.prices.length) errors.push(`${file}: recordCount 與 prices 長度不一致`)
  if (value.firstTradeDate !== value.prices[0].tradeDate) errors.push(`${file}: firstTradeDate 與第一筆不一致`)
  if (value.lastTradeDate !== value.prices.at(-1).tradeDate) errors.push(`${file}: lastTradeDate 與最後一筆不一致`)
  return errors
}

export function validateMarketHeatmapDataset(value, file) {
  const errors = []
  if (!value || typeof value !== 'object') return [`${file}: Heatmap 根節點無效`]
  if (value.schemaVersion !== '1.0') errors.push(`${file}: Heatmap schemaVersion 必須為 1.0`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.tradeDate ?? '')) errors.push(`${file}: Heatmap tradeDate 無效`)
  if (!Number.isFinite(Date.parse(value.generatedAt))) errors.push(`${file}: Heatmap generatedAt 無效`)
  if (!Array.isArray(value.industries) || !Array.isArray(value.stocks)) return [...errors, `${file}: Heatmap industries / stocks 必須為陣列`]
  if (value.sampleSize !== value.stocks.length || value.mappedStockCount !== value.stocks.length) errors.push(`${file}: Heatmap 樣本數與 stocks 長度不一致`)
  if (value.mappedStockCount + value.unmappedStockCount !== value.totalStockUniverse) errors.push(`${file}: Heatmap 分類數與全市場母體不一致`)
  const expectedCoverage = value.totalStockUniverse ? value.mappedStockCount / value.totalStockUniverse * 100 : 0
  if (!Number.isFinite(value.coverageRate) || Math.abs(value.coverageRate - expectedCoverage) > 0.01) errors.push(`${file}: Heatmap coverageRate 不一致`)
  const ids = new Set()
  for (const node of [...value.industries, ...value.stocks]) {
    if (!node || typeof node !== 'object' || !node.id || !node.name) { errors.push(`${file}: Heatmap 含無效節點`); continue }
    if (ids.has(node.id)) errors.push(`${file}: Heatmap 重複節點 ${node.id}`)
    ids.add(node.id)
    if (!['industry', 'stock'].includes(node.type)) errors.push(`${file}: ${node.id} type 無效`)
    if (!['official', 'derived', 'mixed', 'missing'].includes(node.status)) errors.push(`${file}: ${node.id} status 無效`)
    for (const field of ['close', 'tradingAmount', 'tradingVolume', 'marketWeight', 'sizeValue']) if (node[field] !== null && (!Number.isFinite(node[field]) || node[field] < 0)) errors.push(`${file}: ${node.id} ${field} 無效`)
    for (const field of ['technicalScore', 'decisionScore']) if (node[field] !== null && (!Number.isFinite(node[field]) || node[field] < 0 || node[field] > 100)) errors.push(`${file}: ${node.id} ${field} 無效`)
  }
  return errors
}

export function validateJsonShape(value, file) {
  const errors = []
  if (file.includes('twse-stock-history/stocks/')) errors.push(...validateStockHistoryDataset(value, file))
  if (file.includes('technical-index/latest.json') && (value?.formulaVersion !== 'technical-v1.0' || !Array.isArray(value?.records))) errors.push(`${file}: 技術索引 schema 不完整`)
  if (file.includes('screener/latest.json') && (value?.formulaVersion !== 'screener-v1.0' || !Array.isArray(value?.results) || !Array.isArray(value?.presets))) errors.push(`${file}: 選股結果 schema 不完整`)
  if (file.includes('market-heatmap/index.json') && (value?.schemaVersion !== '1.0' || !Array.isArray(value?.dates))) errors.push(`${file}: Heatmap index schema 不完整`)
  if (file.includes('market-heatmap/latest.json') || file.includes('market-heatmap/history/')) errors.push(...validateMarketHeatmapDataset(value, file))
  if (value === null || typeof value !== 'object') return [`${file}: JSON 根節點必須為物件或陣列`]
  if (file.includes('twse-stock-history/stocks/')) {
    const required = ['schemaVersion', 'symbol', 'name', 'market', 'source', 'sourceUrl', 'fetchedAt', 'firstTradeDate', 'lastTradeDate', 'recordCount', 'status', 'warnings', 'prices']
    for (const field of required) if (!(field in value)) errors.push(`${file}: 缺少 ${field}`)
    if (Array.isArray(value.prices)) {
      const dates = new Set()
      for (const point of value.prices) {
        if (!point || typeof point !== 'object' || typeof point.tradeDate !== 'string') { errors.push(`${file}: prices 包含無效項目`); continue }
        if (dates.has(point.tradeDate)) errors.push(`${file}: 重複交易日期 ${point.tradeDate}`)
        dates.add(point.tradeDate)
      }
      if (value.recordCount !== value.prices.length) errors.push(`${file}: recordCount 與 prices 長度不一致`)
    }
  }
  if (file.includes('twse-stock-history/index.json') || file.includes('twse-stock-history/latest.json')) {
    if (value.schemaVersion !== '1.0' || !Array.isArray(value.symbols) || !value.summary) errors.push(`${file}: 歷史行情索引 schema 不完整`)
  }
  return errors
}

async function listJsonFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const nested = await Promise.all(entries.map((entry) => entry.isDirectory() ? listJsonFiles(path.join(directory, entry.name)) : entry.name.endsWith('.json') ? [path.join(directory, entry.name)] : []))
  return nested.flat()
}

export async function validatePublicJson(directory = PUBLIC_DATA) {
  const files = await listJsonFiles(directory)
  const errors = []
  for (const file of files) {
    const info = await stat(file)
    const relative = path.relative(process.cwd(), file).replaceAll('\\', '/')
    if (info.size === 0) { errors.push(`${relative}: 檔案為空白`); continue }
    if (info.size > MAX_JSON_BYTES) { errors.push(`${relative}: 檔案異常過大（${info.size} bytes）`); continue }
    const text = await readFile(file, 'utf8')
    const parsed = validateJsonText(text, relative)
    errors.push(...parsed.errors)
    if (parsed.valid) errors.push(...validateJsonShape(parsed.value, relative))
  }
  return { valid: errors.length === 0, fileCount: files.length, errors }
}

async function main() {
  const result = await validatePublicJson()
  if (!result.valid) {
    console.error(`[data:validate] ${result.errors.length} 個錯誤：`)
    result.errors.forEach((error) => console.error(`- ${error}`))
    process.exitCode = 1
    return
  }
  console.log(`[data:validate] 通過，共驗證 ${result.fileCount} 個 JSON 檔案。`)
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) void main()

