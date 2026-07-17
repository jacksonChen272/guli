import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const OUTPUT_ROOT = path.join(ROOT, 'public', 'data', 'twse-stock-history')
const STOCK_DIR = path.join(OUTPUT_ROOT, 'stocks')
const STOCK_DAILY_PATH = path.join(ROOT, 'public', 'data', 'twse-stocks', 'latest.json')
const ENDPOINT = 'https://www.twse.com.tw/rwd/zh/afterTrading/STOCK_DAY'
const TARGET_DAYS = 250
const PRIORITY_SYMBOLS = ['2330', '2317', '2454', '2313', '3006', '2303', '2382', '3231', '3017', '2603', '2615', '2881', '2882', '2891', '1301', '1303']
const WATCHLIST_SYMBOLS = ['2330', '2313', '3006']
const FETCH_TIMEOUT_MS = 15_000
const MAX_RETRIES = 3
const RATE_LIMIT_MS = 1_000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const round = (value, digits = 4) => Number(value.toFixed(digits))
const hasInvalidText = (text) => /<<<<<<<|=======|>>>>>>>|\uFFFD/.test(text)

function parseArgs(argv) {
  const options = { mode: 'priority', symbols: [], offset: 0, batchSize: Number.POSITIVE_INFINITY, targetDays: TARGET_DAYS }
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]
    if (value === '--watchlist') options.mode = 'watchlist'
    else if (value === '--all') options.mode = 'all'
    else if (value === '--symbol') options.symbols.push(argv[++index])
    else if (value.startsWith('--symbol=')) options.symbols.push(value.split('=')[1])
    else if (value === '--symbols') options.symbols.push(...String(argv[++index] ?? '').split(','))
    else if (value.startsWith('--symbols=')) options.symbols.push(...value.slice(10).split(','))
    else if (value === '--offset') options.offset = Number(argv[++index] ?? 0)
    else if (value === '--batch-size') options.batchSize = Number(argv[++index] ?? options.batchSize)
    else if (value === '--target-days') options.targetDays = Number(argv[++index] ?? TARGET_DAYS)
  }
  options.symbols = [...new Set(options.symbols.map((symbol) => symbol.trim()).filter((symbol) => /^\d{4}$/.test(symbol)))]
  return options
}

function numeric(value) {
  if (value === null || value === undefined) return null
  const cleaned = String(value).trim().replaceAll(',', '').replace(/[^0-9+\-.]/g, '')
  if (!cleaned || cleaned === '-' || cleaned === '--') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function normalizeDate(value) {
  const match = String(value ?? '').trim().match(/^(\d{2,4})[/.\-](\d{1,2})[/.\-](\d{1,2})$/)
  if (!match) return null
  let year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (year < 1911) year += 1911
  const date = new Date(Date.UTC(year, month - 1, day))
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function fieldIndex(fields, names, fallback) {
  const index = fields.findIndex((field) => names.some((name) => String(field).includes(name)))
  return index >= 0 ? index : fallback
}

function normalizeMonth(payload, warnings) {
  const fields = Array.isArray(payload.fields) ? payload.fields : []
  const indexes = {
    date: fieldIndex(fields, ['日期'], 0), volume: fieldIndex(fields, ['成交股數'], 1), amount: fieldIndex(fields, ['成交金額'], 2),
    open: fieldIndex(fields, ['開盤價'], 3), high: fieldIndex(fields, ['最高價'], 4), low: fieldIndex(fields, ['最低價'], 5),
    close: fieldIndex(fields, ['收盤價'], 6), change: fieldIndex(fields, ['漲跌價差'], 7), transactions: fieldIndex(fields, ['成交筆數'], 8),
  }
  if (!fields.length) warnings.push('TWSE 回應未提供欄位名稱，使用官方 STOCK_DAY 既定欄位順序。')
  return (Array.isArray(payload.data) ? payload.data : []).flatMap((row) => {
    const tradeDate = normalizeDate(row[indexes.date])
    if (!tradeDate) { warnings.push(`忽略無效交易日期：${String(row[indexes.date] ?? '')}`); return [] }
    return [{
      tradeDate, open: numeric(row[indexes.open]), high: numeric(row[indexes.high]), low: numeric(row[indexes.low]), close: numeric(row[indexes.close]),
      change: numeric(row[indexes.change]), volume: numeric(row[indexes.volume]), tradingAmount: numeric(row[indexes.amount]), transactionCount: numeric(row[indexes.transactions]),
    }]
  })
}

function validatePoint(point) {
  const errors = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(point.tradeDate)) errors.push('日期格式錯誤')
  const nonNegative = ['open', 'high', 'low', 'close', 'volume', 'tradingAmount', 'transactionCount']
  for (const field of nonNegative) if (point[field] !== null && (!Number.isFinite(point[field]) || point[field] < 0)) errors.push(`${field} 必須為非負有限數值或 null`)
  if (point.change !== null && !Number.isFinite(point.change)) errors.push('change 必須為有限數值或 null')
  if ([point.open, point.high, point.low, point.close].every((value) => value !== null)) {
    if (point.high < Math.max(point.open, point.low, point.close)) errors.push('high 低於其他 OHLC')
    if (point.low > Math.min(point.open, point.high, point.close)) errors.push('low 高於其他 OHLC')
  }
  return errors
}

function mergePrices(existing, incoming) {
  const byDate = new Map()
  for (const point of [...existing, ...incoming]) byDate.set(point.tradeDate, point)
  return [...byDate.values()].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
}

async function fetchJson(url) {
  let lastError
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
      const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'GULI-data-sync/0.9' } })
      if (!response.ok) {
        if (response.status === 307 || response.status === 429) await sleep(attempt * 5_000)
        throw new Error(`HTTP ${response.status}`)
      }
      const contentType = response.headers.get('content-type') ?? ''
      const text = await response.text()
      if (!contentType.includes('json') && !text.trim().startsWith('{')) throw new Error('回應不是 JSON')
      if (hasInvalidText(text)) throw new Error('回應包含衝突標記或無效字元')
      return JSON.parse(text)
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES) await sleep(attempt * 700)
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastError instanceof Error ? lastError : new Error('TWSE 請求失敗')
}

function monthKeys(now = new Date(), count = 18) {
  const result = []
  for (let offset = 0; offset < count; offset += 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - offset, 1))
    result.push(`${date.getUTCFullYear()}${String(date.getUTCMonth() + 1).padStart(2, '0')}01`)
  }
  return result
}

async function readJson(file, fallback = null) {
  try {
    const text = await readFile(file, 'utf8')
    if (hasInvalidText(text)) throw new Error('檔案包含衝突標記或無效字元')
    return JSON.parse(text)
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return fallback
    throw error
  }
}

async function atomicWriteJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  const text = `${JSON.stringify(value, null, 2)}\n`
  if (hasInvalidText(text)) throw new Error(`拒絕寫入含衝突標記或無效字元的檔案：${file}`)
  await writeFile(temporary, text, 'utf8')
  try {
    const verified = await readFile(temporary, 'utf8')
    JSON.parse(verified)
    await rename(temporary, file)
  } catch (error) {
    await unlink(temporary).catch(() => undefined)
    throw error
  }
}

function extractName(payload, fallback) {
  const title = String(payload.title ?? '')
  const match = title.match(/\d{4}\s+([^\s]+)\s+/)
  return match?.[1]?.trim() || fallback
}

async function loadStockUniverse() {
  const dataset = await readJson(STOCK_DAILY_PATH, { records: [] })
  return new Map((dataset.records ?? []).filter((record) => record.instrumentType === 'stock' && /^\d{4}$/.test(record.symbol)).map((record) => [record.symbol, record.name]))
}

function isStale(date) {
  if (!date) return true
  return (Date.now() - Date.parse(`${date}T00:00:00Z`)) / 86_400_000 > 5
}

function sma(values, period) {
  return values.map((_, index) => index + 1 < period || values.slice(index + 1 - period, index + 1).some((value) => value === null) ? null : values.slice(index + 1 - period, index + 1).reduce((sum, value) => sum + value, 0) / period)
}

function ema(values, period) {
  const result = Array(values.length).fill(null)
  if (values.length < period || values.slice(0, period).some((value) => value === null)) return result
  result[period - 1] = values.slice(0, period).reduce((sum, value) => sum + value, 0) / period
  const multiplier = 2 / (period + 1)
  for (let index = period; index < values.length; index += 1) if (values[index] !== null && result[index - 1] !== null) result[index] = (values[index] - result[index - 1]) * multiplier + result[index - 1]
  return result
}

function rsi(values, period = 14) {
  if (values.length <= period || values.slice(-period - 1).some((value) => value === null)) return null
  const window = values.slice(-period - 1)
  let gains = 0; let losses = 0
  for (let index = 1; index < window.length; index += 1) { const change = window[index] - window[index - 1]; gains += Math.max(change, 0); losses += Math.max(-change, 0) }
  return losses === 0 ? 100 : 100 - 100 / (1 + gains / losses)
}

function technicalSummary(prices) {
  const close = prices.map((point) => point.close)
  const volume = prices.map((point) => point.volume)
  const ma20 = sma(close, 20)
  const volume20 = sma(volume, 20)
  const fast = ema(close, 12); const slow = ema(close, 26)
  const macd = fast.map((value, index) => value === null || slow[index] === null ? null : value - slow[index])
  const compact = macd.filter((value) => value !== null)
  const compactSignal = ema(compact, 9)
  const latestMacd = compact.at(-1) ?? null; const previousMacd = compact.at(-2) ?? null
  const latestSignal = compactSignal.at(-1) ?? null; const previousSignal = compactSignal.at(-2) ?? null
  const latestClose = close.at(-1) ?? null; const latestMa20 = ma20.at(-1) ?? null
  const latestVolume = volume.at(-1) ?? null; const latestAverage = volume20.at(-1) ?? null
  return {
    aboveMa20: latestClose === null || latestMa20 === null ? null : latestClose > latestMa20,
    rsiOverbought: prices.length <= 14 ? null : rsi(close) >= 70,
    macdGoldenCross: [latestMacd, previousMacd, latestSignal, previousSignal].some((value) => value === null) ? null : latestMacd > latestSignal && previousMacd <= previousSignal,
    volumeExpansion: latestVolume === null || latestAverage === null || latestAverage === 0 ? null : latestVolume / latestAverage > 1.5,
    indicatorComputable: prices.length >= 60 && latestClose !== null,
  }
}

async function syncSymbol(symbol, fallbackName, targetDays) {
  const output = path.join(STOCK_DIR, `${symbol}.json`)
  const existing = await readJson(output, null)
  let prices = Array.isArray(existing?.prices) ? existing.prices : []
  const warnings = []
  let name = existing?.name || fallbackName || symbol
  const months = prices.length >= targetDays ? monthKeys(new Date(), 2) : monthKeys(new Date(), 18)
  let fetchedMonths = 0
  for (const date of months) {
    const url = `${ENDPOINT}?date=${date}&stockNo=${symbol}&response=json`
    const payload = await fetchJson(url)
    if (payload.stat && payload.stat !== 'OK') { warnings.push(`${date.slice(0, 6)}：${payload.stat}`); continue }
    name = extractName(payload, name)
    prices = mergePrices(prices, normalizeMonth(payload, warnings))
    fetchedMonths += 1
    await sleep(RATE_LIMIT_MS)
    if (prices.length >= targetDays && (!existing?.prices?.length || fetchedMonths >= 2)) break
  }
  const errors = prices.flatMap((point) => validatePoint(point).map((error) => `${point.tradeDate}: ${error}`))
  if (errors.length) throw new Error(errors.slice(0, 3).join('；'))
  if (!prices.length) throw new Error('未取得任何有效交易日資料')
  const fetchedAt = new Date().toISOString()
  const stale = isStale(prices.at(-1).tradeDate)
  const dataset = {
    schemaVersion: '1.0', symbol, name, market: 'TWSE', source: 'TWSE', sourceUrl: ENDPOINT, fetchedAt,
    firstTradeDate: prices[0].tradeDate, lastTradeDate: prices.at(-1).tradeDate, recordCount: prices.length,
    status: stale ? 'stale' : warnings.length ? 'partial' : 'official', warnings: [...new Set(warnings)], prices,
  }
  await atomicWriteJson(output, dataset)
  return dataset
}

async function rebuildIndex(failedSymbols = []) {
  const files = await readdir(STOCK_DIR).catch(() => [])
  const symbols = []
  for (const file of files.filter((file) => /^\d{4}\.json$/.test(file)).sort()) {
    try {
      const dataset = await readJson(path.join(STOCK_DIR, file))
      const technical = technicalSummary(dataset.prices)
      symbols.push({ symbol: dataset.symbol, name: dataset.name, path: `data/twse-stock-history/stocks/${file}`, firstTradeDate: dataset.firstTradeDate, lastTradeDate: dataset.lastTradeDate, recordCount: dataset.recordCount, status: dataset.status, stale: isStale(dataset.lastTradeDate), warnings: dataset.warnings, technical })
    } catch (error) {
      failedSymbols.push(file.replace('.json', ''))
      console.warn(`[history] 忽略無效檔案 ${file}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
  const technicalItems = symbols.filter((item) => item.technical.indicatorComputable)
  const index = {
    schemaVersion: '1.0', source: 'TWSE', updatedAt: new Date().toISOString(), targetTradingDays: TARGET_DAYS, symbols,
    summary: {
      availableSymbols: symbols.length,
      averageRecordCount: symbols.length ? Math.round(symbols.reduce((sum, item) => sum + item.recordCount, 0) / symbols.length) : 0,
      complete250Count: symbols.filter((item) => item.recordCount >= TARGET_DAYS).length,
      staleCount: symbols.filter((item) => item.stale).length,
      failedSymbols: [...new Set(failedSymbols)].sort(),
      technicalSampleSize: technicalItems.length,
      aboveMa20Count: technicalItems.filter((item) => item.technical.aboveMa20).length,
      rsiOverboughtCount: technicalItems.filter((item) => item.technical.rsiOverbought).length,
      macdGoldenCrossCount: technicalItems.filter((item) => item.technical.macdGoldenCross).length,
      volumeExpansionCount: technicalItems.filter((item) => item.technical.volumeExpansion).length,
    },
  }
  await atomicWriteJson(path.join(OUTPUT_ROOT, 'index.json'), index)
  await atomicWriteJson(path.join(OUTPUT_ROOT, 'latest.json'), index)
  return index
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  await mkdir(STOCK_DIR, { recursive: true })
  const universe = await loadStockUniverse()
  let symbols = options.symbols.length ? options.symbols : options.mode === 'all' ? [...universe.keys()] : options.mode === 'watchlist' ? WATCHLIST_SYMBOLS : PRIORITY_SYMBOLS
  symbols = symbols.slice(Math.max(0, options.offset), Math.max(0, options.offset) + Math.max(0, options.batchSize))
  console.log(`[history] 模式=${options.mode}，本批 ${symbols.length} 檔，目標至少 ${options.targetDays} 個交易日。`)
  const failed = []
  let updated = 0
  for (const symbol of symbols) {
    try {
      const dataset = await syncSymbol(symbol, universe.get(symbol) ?? symbol, options.targetDays)
      updated += 1
      console.log(`[history] ${symbol} ${dataset.name}: ${dataset.recordCount} 日，${dataset.firstTradeDate}～${dataset.lastTradeDate}，${dataset.status}`)
    } catch (error) {
      failed.push(symbol)
      console.error(`[history] ${symbol} 失敗；保留既有有效檔案：${error instanceof Error ? error.message : String(error)}`)
    }
  }
  const index = await rebuildIndex(failed)
  console.log(`[history] 完成：更新 ${updated}、失敗 ${failed.length}、可用 ${index.summary.availableSymbols}、250 日完整 ${index.summary.complete250Count}。`)
  if (failed.length) process.exitCode = 1
}

main().catch((error) => {
  console.error(`[history] 同步失敗：${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  process.exitCode = 1
})
