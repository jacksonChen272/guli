import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ENDPOINTS = {
  index: 'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX',
  trading: 'https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK',
  breadth: 'https://openapi.twse.com.tw/v1/opendata/twtazu_od',
  stocks: 'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
}
const OUTPUT = resolve(process.cwd(), 'public/data/twse-market-overview.json')
const SOURCE = '臺灣證券交易所（TWSE）'
const TIMEOUT_MS = 20_000

const pick = (record, keys) => {
  const key = keys.find((candidate) => record?.[candidate] !== undefined)
  return key === undefined ? undefined : record[key]
}
const number = (value) => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/,/g, '').replace(/[^0-9+-.]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}
const date = (value) => {
  const raw = String(value ?? '').trim().replace(/[./]/g, '-').replace(/\s+/g, '')
  const parts = raw.includes('-') ? raw.split('-').map(Number)
    : raw.length === 7 ? [Number(raw.slice(0, 3)), Number(raw.slice(3, 5)), Number(raw.slice(5, 7))]
      : raw.length === 8 ? [Number(raw.slice(0, 4)), Number(raw.slice(4, 6)), Number(raw.slice(6, 8))] : []
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
  let [year, month, day] = parts
  if (year < 1911) year += 1911
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
const signed = (value, sign) => {
  const parsed = number(value)
  return parsed === null ? null : String(sign ?? '').trim() === '-' ? -Math.abs(parsed) : parsed
}
const percentage = (close, change) => {
  const previous = close - change
  return previous > 0 ? change / previous * 100 : 0
}
const count = (record, keys) => {
  const value = number(pick(record, keys))
  return value === null ? null : Math.trunc(value)
}

async function fetchJson(label, url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'GULI-Data-Sync/0.7.2' } })
    if (!response.ok) throw new Error(`${label} HTTP ${response.status}`)
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) throw new Error(`${label} 回應不是 JSON（${contentType || 'unknown'}）`)
    const text = await response.text()
    try { return JSON.parse(text) }
    catch { throw new Error(`${label} 回應 JSON 無法解析`) }
  } finally { clearTimeout(timeout) }
}

const normalizeStock = (row, tradeDate) => {
  const symbol = String(pick(row, ['Code', '證券代號']) ?? '').trim()
  const name = String(pick(row, ['Name', '證券名稱']) ?? '').trim()
  const rowDate = date(pick(row, ['Date', '日期']))
  const close = number(pick(row, ['ClosingPrice', '收盤價']))
  const change = signed(pick(row, ['Change', '漲跌價差']), pick(row, ['漲跌', '漲跌符號']))
  const tradingAmount = number(pick(row, ['TradeValue', '成交金額', '成交值']))
  const tradingVolume = number(pick(row, ['TradeVolume', '成交股數', '成交量']))
  if (!/^\d{4}$/.test(symbol) || /^00/.test(symbol) || !name || rowDate !== tradeDate || close === null || close <= 0 || change === null
    || tradingAmount === null || tradingAmount < 0 || tradingVolume === null || tradingVolume < 0) return null
  return { symbol, name, close, change, changePercent: percentage(close, change), tradingAmount, tradingVolume }
}
const rank = (items, selector, direction = 'desc') => [...items].sort((left, right) => {
  const difference = selector(left) - selector(right)
  return difference === 0 ? left.symbol.localeCompare(right.symbol) : direction === 'asc' ? difference : -difference
}).slice(0, 10)

function normalize(indexRows, tradingRows, breadthRows, stockRows, fetchedAt, fetchWarnings = []) {
  if (![indexRows, tradingRows, breadthRows, stockRows].every(Array.isArray)) throw new Error('TWSE 回應格式不是陣列')
  const index = indexRows.find((row) => ['發行量加權股價指數', 'TAIEX'].includes(String(pick(row, ['指數', 'IndexName']) ?? '')))
  if (!index) throw new Error('找不到發行量加權股價指數欄位')
  const tradeDate = date(pick(index, ['日期', 'Date']))
  const trading = [...tradingRows].reverse().find((row) => date(pick(row, ['Date', '日期'])) === tradeDate)
  if (!trading) throw new Error(`找不到 ${tradeDate ?? '未知日期'} 的市場成交資料`)

  const warnings = [...fetchWarnings]
  const indexValue = number(pick(index, ['收盤指數', 'TAIEX', '指數值']))
  const change = signed(pick(index, ['漲跌點數', 'Change']), pick(index, ['漲跌', '漲跌符號']))
  const rawPercent = signed(pick(index, ['漲跌百分比', 'ChangePercent', '漲跌幅']), pick(index, ['漲跌', '漲跌符號']))
  const previousIndex = indexValue !== null && change !== null ? indexValue - change : null
  const changePercent = rawPercent ?? (previousIndex && change !== null ? change / previousIndex * 100 : null)
  const tradingAmount = number(pick(trading, ['TradeValue', '成交金額', '成交值']))
  const tradingVolume = number(pick(trading, ['TradeVolume', '成交股數', '成交量']))
  const transactionCount = number(pick(trading, ['Transaction', '成交筆數']))

  const tradingHistory = tradingRows.map((row) => ({
    tradeDate: date(pick(row, ['Date', '日期'])),
    indexValue: number(pick(row, ['TAIEX', '發行量加權股價指數'])),
    tradingAmount: number(pick(row, ['TradeValue', '成交金額', '成交值'])),
    tradingVolume: number(pick(row, ['TradeVolume', '成交股數', '成交量'])),
    transactionCount: number(pick(row, ['Transaction', '成交筆數'])),
  })).filter((point) => point.tradeDate && point.tradeDate <= tradeDate && point.indexValue > 0 && point.tradingAmount >= 0 && point.tradingVolume >= 0 && point.transactionCount >= 0)
    .sort((left, right) => left.tradeDate.localeCompare(right.tradeDate)).slice(-20)

  const stocks = stockRows.map((row) => normalizeStock(row, tradeDate)).filter(Boolean)
  if (!stocks.length) throw new Error(`STOCK_DAY_ALL 找不到 ${tradeDate} 的有效上市股票資料`)
  const rankings = {
    tradingAmount: rank(stocks, (item) => item.tradingAmount),
    tradingVolume: rank(stocks, (item) => item.tradingVolume),
    gainers: rank(stocks.filter((item) => item.changePercent > 0), (item) => item.changePercent),
    losers: rank(stocks.filter((item) => item.changePercent < 0), (item) => item.changePercent, 'asc'),
  }

  const breadth = breadthRows.find((row) => String(pick(row, ['類型', 'Type']) ?? '') === '股票' && date(pick(row, ['出表日期', '日期', 'Date'])) === tradeDate)
  const breadthSource = breadth ? 'twtazu_od' : 'stock_day_all'
  const counts = breadth ? {
    advanceCount: count(breadth, ['上漲', 'Advance', '上漲家數']),
    declineCount: count(breadth, ['下跌', 'Decline', '下跌家數']),
    unchangedCount: count(breadth, ['持平', '平盤', 'Unchanged', '平盤家數']),
    limitUpCount: count(breadth, ['漲停', 'LimitUp', '漲停家數']),
    limitDownCount: count(breadth, ['跌停', 'LimitDown', '跌停家數']),
  } : {
    advanceCount: stocks.filter((stock) => stock.change > 0).length,
    declineCount: stocks.filter((stock) => stock.change < 0).length,
    unchangedCount: stocks.filter((stock) => stock.change === 0).length,
    limitUpCount: stocks.filter((stock) => stock.changePercent >= 9.5).length,
    limitDownCount: stocks.filter((stock) => stock.changePercent <= -9.5).length,
  }
  if (!breadth) warnings.push('twtazu_od 尚未發布同交易日統計；市場廣度由 TWSE STOCK_DAY_ALL 官方股票資料彙整，漲跌停家數依漲跌幅 9.5% 門檻推導。')
  if (Object.values(counts).some((value) => value === null)) warnings.push('TWSE 官方市場廣度欄位不完整，缺值保留 null。')
  if (Object.values(rankings).some((items) => items.length < 10)) warnings.push('TWSE 官方個股資料不足，部分排行少於 10 筆。')

  const incomplete = [indexValue, change, changePercent, tradingAmount, tradingVolume, transactionCount].some((value) => value === null)
    || Object.values(counts).some((value) => value === null) || Object.values(rankings).some((items) => items.length < 10)
  const result = {
    schemaVersion: '2.0', market: 'TWSE', tradeDate,
    indexName: String(pick(index, ['指數', 'IndexName']) ?? '發行量加權股價指數'),
    indexValue, change, changePercent, tradingAmount, tradingVolume, transactionCount,
    ...counts, breadthSource, tradingHistory, rankings,
    source: SOURCE, sourceUrl: Object.values(ENDPOINTS).join(' | '), fetchedAt,
    status: incomplete ? 'partial' : 'official', warnings,
  }
  validate(result)
  return result
}

function validate(data) {
  const errors = []
  if (data.schemaVersion !== '2.0') errors.push('schemaVersion 無效')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tradeDate ?? '')) errors.push('交易日期無效')
  if (!Number.isFinite(data.indexValue) || data.indexValue <= 0) errors.push('指數值無效')
  if (!Number.isFinite(data.change) || !Number.isFinite(data.changePercent)) errors.push('指數漲跌無效')
  for (const [label, value] of [['成交值', data.tradingAmount], ['成交量', data.tradingVolume], ['成交筆數', data.transactionCount]]) if (!Number.isFinite(value) || value < 0) errors.push(`${label}無效`)
  for (const [label, value] of [['上漲', data.advanceCount], ['下跌', data.declineCount], ['平盤', data.unchangedCount], ['漲停', data.limitUpCount], ['跌停', data.limitDownCount]]) if (value !== null && (!Number.isInteger(value) || value < 0)) errors.push(`${label}家數無效`)
  for (const [key, items] of Object.entries(data.rankings)) {
    if (!Array.isArray(items) || items.length !== 10) errors.push(`${key} 排行必須包含 10 筆`)
    for (const item of items ?? []) if (!/^\d{4}$/.test(item.symbol) || /^00/.test(item.symbol) || item.close <= 0 || item.tradingAmount < 0 || item.tradingVolume < 0 || !Number.isFinite(item.changePercent)) errors.push(`${key} 排行資料無效`)
  }
  if (!Number.isFinite(Date.parse(data.fetchedAt))) errors.push('抓取時間無效')
  if (data.source !== SOURCE || !data.sourceUrl.includes('openapi.twse.com.tw')) errors.push('資料來源不是 TWSE 官方 OpenAPI')
  if (errors.length) throw new Error(`資料品質驗證失敗：${[...new Set(errors)].join('、')}`)
}

async function main() {
  const fetchedAt = new Date().toISOString()
  console.log('[GULI] 開始同步 TWSE 官方市場統計與排行…')
  const breadthWarnings = []
  const breadthPromise = fetchJson('twtazu_od', ENDPOINTS.breadth).catch((error) => {
    breadthWarnings.push(`twtazu_od 讀取失敗，改由 STOCK_DAY_ALL 彙整市場廣度：${error instanceof Error ? error.message : String(error)}`)
    return []
  })
  const [indexRows, tradingRows, breadthRows, stockRows] = await Promise.all([
    fetchJson('MI_INDEX', ENDPOINTS.index),
    fetchJson('FMTQIK', ENDPOINTS.trading),
    breadthPromise,
    fetchJson('STOCK_DAY_ALL', ENDPOINTS.stocks),
  ])
  const data = normalize(indexRows, tradingRows, breadthRows, stockRows, fetchedAt, breadthWarnings)
  await mkdir(dirname(OUTPUT), { recursive: true })
  const temporary = `${OUTPUT}.${process.pid}.tmp`
  try { await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8'); await rename(temporary, OUTPUT) }
  finally { await rm(temporary, { force: true }) }
  console.log(`[GULI] 同步成功：${data.tradeDate}｜TAIEX ${data.indexValue}｜成交值 ${data.tradingAmount} 元｜成交量 ${data.tradingVolume} 股｜排行 4×10｜${data.status}`)
  console.log(`[GULI] 市場廣度：漲 ${data.advanceCount}／跌 ${data.declineCount}／平 ${data.unchangedCount}／漲停 ${data.limitUpCount}／跌停 ${data.limitDownCount}（${data.breadthSource}）`)
  data.warnings.forEach((warning) => console.warn(`[GULI] Warning: ${warning}`))
}

main().catch((error) => {
  console.error(`[GULI] 同步失敗，保留上一份有效資料：${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
})
