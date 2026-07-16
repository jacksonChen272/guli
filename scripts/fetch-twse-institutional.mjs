import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const BASE = resolve(process.cwd(), 'public/data/twse-institutional')
const HISTORY = resolve(BASE, 'history')
const BFI82U = 'https://www.twse.com.tw/rwd/zh/fund/BFI82U'
const T86 = 'https://www.twse.com.tw/rwd/zh/fund/T86'
const TIMEOUT_MS = 20_000
const numberOrNull = (value) => { if (value === null || value === undefined || value === '' || value === '--' || value === '---') return null; const parsed = Number(String(value).replace(/,/g, '').replace(/[^\d+-.]/g, '')); return Number.isFinite(parsed) ? parsed : null }
const isoDate = (digits) => `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
const atomicWrite = async (path, value) => { const temp = `${path}.${process.pid}.tmp`; try { await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(temp, path) } finally { await rm(temp, { force: true }) } }
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const row = (rows, pattern) => rows.find((item) => pattern.test(String(item?.[0] ?? '')))
const amount = (item) => item ? { buyAmount: numberOrNull(item[1]), sellAmount: numberOrNull(item[2]), netAmount: numberOrNull(item[3]) } : { buyAmount: null, sellAmount: null, netAmount: null }
const sumNullable = (...values) => values.every((value) => value === null) ? null : values.reduce((sum, value) => sum + (value ?? 0), 0)
const fieldIndex = (response, patterns, fallback) => { const fields = Array.isArray(response?.fields) ? response.fields.map(String) : []; const index = fields.findIndex((field) => patterns.some((pattern) => pattern.test(field))); return index >= 0 ? index : fallback }

async function fetchJson(url) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'GULI-Data-Sync/0.8.0-beta.1' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const text = await response.text(); try { return JSON.parse(text) } catch { throw new Error('回應不是有效 JSON') }
  } finally { clearTimeout(timeout) }
}

const taipeiDigits = (date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date).replace(/-/g, '')
async function findLatest() {
  const now = new Date()
  for (let offset = 0; offset < 14; offset++) {
    const candidate = new Date(now); candidate.setUTCDate(candidate.getUTCDate() - offset)
    const digits = taipeiDigits(candidate)
    const [market, stocks] = await Promise.all([
      fetchJson(`${BFI82U}?dayDate=${digits}&type=day&response=json`).catch(() => null),
      fetchJson(`${T86}?date=${digits}&selectType=ALLBUT0999&response=json`).catch(() => null),
    ])
    if (market?.stat === 'OK' && stocks?.stat === 'OK' && Array.isArray(market.data) && market.data.length && Array.isArray(stocks.data) && stocks.data.length) return { digits, market, stocks }
  }
  throw new Error('最近 14 天找不到同交易日的 BFI82U 與 T86 有效資料。')
}

function normalize({ digits, market, stocks }, fetchedAt) {
  const warnings = []
  const foreign = amount(row(market.data, /^外資及陸資\(不含外資自營商\)$/))
  const trust = amount(row(market.data, /^投信$/))
  const dealerSelf = amount(row(market.data, /^自營商\(自行買賣\)$/))
  const dealerHedge = amount(row(market.data, /^自營商\(避險\)$/))
  const dealer = { buyAmount: sumNullable(dealerSelf.buyAmount, dealerHedge.buyAmount), sellAmount: sumNullable(dealerSelf.sellAmount, dealerHedge.sellAmount), netAmount: sumNullable(dealerSelf.netAmount, dealerHedge.netAmount) }
  const total = amount(row(market.data, /^合計$/))
  const marketTotals = { foreign, trust, dealer, total }
  Object.entries(marketTotals).forEach(([key, values]) => { if (Object.values(values).some((value) => value === null)) warnings.push(`${key} 市場金額欄位不完整。`) })
  const tradeDate = isoDate(digits)
  const indices = { symbol: fieldIndex(stocks, [/證券代號/, /股票代號/], 0), name: fieldIndex(stocks, [/證券名稱/, /股票名稱/], 1), foreign: fieldIndex(stocks, [/外陸資買賣超股數.*不含外資自營商/, /外資及陸資買賣超股數.*不含外資自營商/], 4), trust: fieldIndex(stocks, [/投信買賣超股數/], 10), dealer: fieldIndex(stocks, [/^自營商買賣超股數$/], 11), total: fieldIndex(stocks, [/三大法人買賣超股數/], 18) }
  const seen = new Set()
  const records = stocks.data.filter((item) => /^\d{4}$/.test(String(item?.[indices.symbol] ?? '').trim()) && !String(item?.[indices.symbol] ?? '').trim().startsWith('00')).map((item) => {
    const symbol = String(item[indices.symbol] ?? '').trim(); const itemWarnings = []
    if (seen.has(symbol)) itemWarnings.push(`重複股票代號：${symbol}`); seen.add(symbol)
    const record = { symbol, name: String(item[indices.name] ?? '').trim(), foreignNetShares: numberOrNull(item[indices.foreign]), trustNetShares: numberOrNull(item[indices.trust]), dealerNetShares: numberOrNull(item[indices.dealer]), totalNetShares: numberOrNull(item[indices.total]), tradeDate, source: 'TWSE', fetchedAt, status: 'official', warnings: itemWarnings }
    if ([record.foreignNetShares, record.trustNetShares, record.dealerNetShares, record.totalNetShares].some((value) => value === null)) { record.status = 'partial'; record.warnings.push('個股法人買賣超欄位不完整。') }
    return record
  })
  if (records.length < 100) warnings.push(`個股法人資料筆數偏低：${records.length} 筆。`)
  const status = warnings.length || records.some((record) => record.status === 'partial') ? 'partial' : 'official'
  return { schemaVersion: '1.0', market: 'TWSE', tradeDate, fetchedAt, units: { marketTotals: 'TWD', stockNet: 'shares' }, marketTotals, records, source: { name: '臺灣證券交易所（TWSE）', marketEndpoint: BFI82U, stockEndpoint: T86 }, status, warnings }
}

function validate(dataset) {
  const errors = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataset.tradeDate)) errors.push('tradeDate')
  if (!Number.isFinite(Date.parse(dataset.fetchedAt))) errors.push('fetchedAt')
  if (dataset.units.marketTotals !== 'TWD' || dataset.units.stockNet !== 'shares') errors.push('units')
  Object.values(dataset.marketTotals).forEach((item) => { if (item.buyAmount !== null && item.buyAmount < 0) errors.push('negative buy amount'); if (item.sellAmount !== null && item.sellAmount < 0) errors.push('negative sell amount'); if (item.netAmount !== null && !Number.isFinite(item.netAmount)) errors.push('invalid net amount') })
  const symbols = new Set()
  dataset.records.forEach((item) => { if (!/^\d{4,6}$/.test(item.symbol)) errors.push(`symbol:${item.symbol}`); if (symbols.has(item.symbol)) errors.push(`duplicate:${item.symbol}`); symbols.add(item.symbol); for (const key of ['foreignNetShares', 'trustNetShares', 'dealerNetShares', 'totalNetShares']) if (item[key] !== null && !Number.isFinite(item[key])) errors.push(`${item.symbol}:${key}`) })
  if (!dataset.records.length) errors.push('empty records')
  return [...new Set(errors)]
}

async function main() {
  console.log('[GULI] 正在同步 TWSE 官方三大法人盤後資料（BFI82U + T86）。')
  const fetchedAt = new Date().toISOString(); const raw = await findLatest(); const dataset = normalize(raw, fetchedAt); const errors = validate(dataset)
  if (errors.length) throw new Error(`資料驗證失敗：${errors.join(', ')}`)
  await mkdir(HISTORY, { recursive: true })
  const indexPath = resolve(BASE, 'index.json'); let index = { schemaVersion: '1.0', latestTradeDate: dataset.tradeDate, updatedAt: fetchedAt, datasets: [] }
  try { index = await readJson(indexPath) } catch (error) { if (error?.code !== 'ENOENT') throw error }
  const item = { tradeDate: dataset.tradeDate, path: `data/twse-institutional/history/${dataset.tradeDate}.json`, recordCount: dataset.records.length, status: dataset.status }
  const datasets = [item, ...(Array.isArray(index.datasets) ? index.datasets.filter((entry) => entry.tradeDate !== dataset.tradeDate) : [])].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))
  await atomicWrite(resolve(HISTORY, `${dataset.tradeDate}.json`), dataset)
  await atomicWrite(resolve(BASE, 'latest.json'), dataset)
  await atomicWrite(indexPath, { schemaVersion: '1.0', latestTradeDate: dataset.tradeDate, updatedAt: fetchedAt, datasets })
  console.log(`[GULI] 法人同步完成：交易日 ${dataset.tradeDate}，個股 ${dataset.records.length} 筆，狀態 ${dataset.status}。`)
  console.log(`[GULI] 三大法人合計：買進 ${dataset.marketTotals.total.buyAmount} 元，賣出 ${dataset.marketTotals.total.sellAmount} 元，差額 ${dataset.marketTotals.total.netAmount} 元。`)
  dataset.warnings.forEach((warning) => console.warn(`[GULI] warning: ${warning}`))
}

main().catch((error) => { console.error(`[GULI] TWSE 法人同步失敗；既有有效 JSON 未被覆蓋：${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1 })
