import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ENDPOINTS = {
  index: 'https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX',
  trading: 'https://openapi.twse.com.tw/v1/exchangeReport/FMTQIK',
  breadth: 'https://openapi.twse.com.tw/v1/opendata/twtazu_od',
}
const OUTPUT = resolve(process.cwd(), 'public/data/twse-market-overview.json')
const SOURCE = '臺灣證券交易所（TWSE）'
const TIMEOUT_MS = 15_000

const pick = (record, keys) => keys.find((key) => record?.[key] !== undefined) ? record[keys.find((key) => record?.[key] !== undefined)] : undefined
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
  const parts = raw.includes('-') ? raw.split('-').map(Number) : raw.length === 7 ? [Number(raw.slice(0, 3)), Number(raw.slice(3, 5)), Number(raw.slice(5, 7))] : raw.length === 8 ? [Number(raw.slice(0, 4)), Number(raw.slice(4, 6)), Number(raw.slice(6, 8))] : []
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null
  let [year, month, day] = parts
  if (year < 1911) year += 1911
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
const signed = (value, sign) => { const parsed = number(value); return parsed === null ? null : String(sign ?? '').trim() === '-' ? -Math.abs(parsed) : parsed }

async function fetchJson(label, url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json', 'user-agent': 'GULI-Data-Sync/0.5.2' } })
    if (!response.ok) throw new Error(`${label} HTTP ${response.status}`)
    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('json')) throw new Error(`${label} 回應不是 JSON（${contentType || 'unknown'}）`)
    const text = await response.text()
    try { return JSON.parse(text) }
    catch { throw new Error(`${label} 回應 JSON 無法解析`) }
  } finally { clearTimeout(timeout) }
}

function normalize(indexRows, tradingRows, breadthRows, fetchedAt) {
  if (!Array.isArray(indexRows) || !Array.isArray(tradingRows) || !Array.isArray(breadthRows)) throw new Error('TWSE 回應格式不是陣列')
  const index = indexRows.find((row) => ['發行量加權股價指數', 'TAIEX'].includes(String(pick(row, ['指數', 'IndexName']) ?? '')))
  if (!index) throw new Error('找不到發行量加權股價指數欄位')
  const tradeDate = date(pick(index, ['日期', 'Date']))
  const trading = [...tradingRows].reverse().find((row) => date(pick(row, ['Date', '日期'])) === tradeDate)
  if (!trading) throw new Error(`找不到 ${tradeDate ?? '未知日期'} 的成交金額`)
  const breadth = breadthRows.find((row) => String(pick(row, ['類型', 'Type']) ?? '') === '股票' && date(pick(row, ['出表日期', '日期', 'Date'])) === tradeDate)
  const warnings = []
  const indexValue = number(pick(index, ['收盤指數', 'TAIEX', '指數值']))
  const change = signed(pick(index, ['漲跌點數', 'Change']), pick(index, ['漲跌', '漲跌符號']))
  const changePercent = signed(pick(index, ['漲跌百分比', 'ChangePercent', '漲跌幅']), pick(index, ['漲跌', '漲跌符號']))
  const tradingAmount = number(pick(trading, ['TradeValue', '成交金額', '成交值']))
  const toCount = (keys) => { const value = number(pick(breadth, keys)); return value === null ? null : Math.trunc(value) }
  const advanceCount = toCount(['上漲', 'Advance', '上漲家數'])
  const declineCount = toCount(['下跌', 'Decline', '下跌家數'])
  const unchangedCount = toCount(['持平', '平盤', 'Unchanged', '平盤家數'])
  if (!breadth) warnings.push('漲跌家數端點沒有同交易日股票統計，相關欄位保留 null。')
  if ([advanceCount, declineCount, unchangedCount].some((value) => value === null)) warnings.push('TWSE 官方資料缺少完整漲跌家數，本筆資料為部分資料。')
  const result = { market: 'TWSE', tradeDate, indexName: String(pick(index, ['指數', 'IndexName']) ?? '發行量加權股價指數'), indexValue, change, changePercent, tradingAmount, advanceCount, declineCount, unchangedCount, source: SOURCE, sourceUrl: Object.values(ENDPOINTS).join(' | '), fetchedAt, status: warnings.length ? 'partial' : 'official', warnings }
  validate(result)
  return result
}

function validate(data) {
  const errors = []
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tradeDate ?? '')) errors.push('交易日期無效')
  if (!Number.isFinite(data.indexValue) || data.indexValue <= 0) errors.push('指數值無效')
  if (!Number.isFinite(data.change)) errors.push('漲跌點無效')
  if (!Number.isFinite(data.changePercent)) errors.push('漲跌幅無效')
  if (!Number.isFinite(data.tradingAmount) || data.tradingAmount < 0) errors.push('成交金額無效')
  for (const [label, value] of [['上漲', data.advanceCount], ['下跌', data.declineCount], ['平盤', data.unchangedCount]]) if (value !== null && (!Number.isFinite(value) || value < 0)) errors.push(`${label}家數無效`)
  if (!Number.isFinite(Date.parse(data.fetchedAt))) errors.push('抓取時間無效')
  if (data.source !== SOURCE) errors.push('資料來源不是 TWSE')
  if (errors.length) throw new Error(`資料品質驗證失敗：${errors.join('、')}`)
}

async function main() {
  const fetchedAt = new Date().toISOString()
  console.log('[GULI] 開始同步 TWSE 官方盤後市場總覽…')
  const [indexRows, tradingRows, breadthRows] = await Promise.all([
    fetchJson('MI_INDEX', ENDPOINTS.index), fetchJson('FMTQIK', ENDPOINTS.trading), fetchJson('twtazu_od', ENDPOINTS.breadth),
  ])
  const data = normalize(indexRows, tradingRows, breadthRows, fetchedAt)
  await mkdir(dirname(OUTPUT), { recursive: true })
  const temporary = `${OUTPUT}.${process.pid}.tmp`
  try { await writeFile(temporary, `${JSON.stringify(data, null, 2)}\n`, 'utf8'); await rename(temporary, OUTPUT) }
  finally { await rm(temporary, { force: true }) }
  console.log(`[GULI] 同步成功：${data.tradeDate}｜TAIEX ${data.indexValue}｜成交金額 ${data.tradingAmount} 元｜${data.status}`)
  if (data.warnings.length) data.warnings.forEach((warning) => console.warn(`[GULI] Warning: ${warning}`))
}

main().catch((error) => { console.error(`[GULI] 同步失敗，保留上一份有效資料：${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1 })
