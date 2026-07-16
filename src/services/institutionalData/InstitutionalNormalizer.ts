import type { InstitutionalAmount, InstitutionalMarketTotals, OfficialInstitutionalDataset, OfficialStockInstitutionalRecord } from '../../types/officialInstitutionalData'

export interface TWSETableResponse { date?: unknown; stat?: unknown; fields?: unknown; data?: unknown }

export const parseInstitutionalNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '' || value === '--' || value === '---') return null
  const normalized = String(value).replace(/,/g, '').replace(/[^\d+-.]/g, '')
  if (!normalized) return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const normalizeTWSEDate = (value: unknown): string | null => {
  const digits = String(value ?? '').replace(/\D/g, '')
  if (digits.length === 8) return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
  if (digits.length === 7) return `${Number(digits.slice(0, 3)) + 1911}-${digits.slice(3, 5)}-${digits.slice(5)}`
  return null
}

const emptyAmount = (): InstitutionalAmount => ({ buyAmount: null, sellAmount: null, netAmount: null })
const sumNullable = (...values: Array<number | null>): number | null => values.every((value) => value === null) ? null : values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
const table = (response: TWSETableResponse) => Array.isArray(response.data) ? response.data.filter(Array.isArray) as unknown[][] : []
const fieldIndex = (response: TWSETableResponse, patterns: RegExp[], fallback: number) => { const fields = Array.isArray(response.fields) ? response.fields.map(String) : []; const index = fields.findIndex((field) => patterns.some((pattern) => pattern.test(field))); return index >= 0 ? index : fallback }
const rowByName = (rows: unknown[][], pattern: RegExp) => rows.find((row) => pattern.test(String(row[0] ?? '')))
const amountFromRow = (row?: unknown[]): InstitutionalAmount => row ? { buyAmount: parseInstitutionalNumber(row[1]), sellAmount: parseInstitutionalNumber(row[2]), netAmount: parseInstitutionalNumber(row[3]) } : emptyAmount()

export function normalizeInstitutionalDataset(marketResponse: TWSETableResponse, stockResponse: TWSETableResponse, fetchedAt: string): OfficialInstitutionalDataset {
  const warnings: string[] = []
  const marketRows = table(marketResponse)
  const stockRows = table(stockResponse)
  const tradeDate = normalizeTWSEDate(stockResponse.date) ?? normalizeTWSEDate(marketResponse.date)
  if (!tradeDate) throw new Error('TWSE 法人資料缺少有效交易日期。')
  const foreign = amountFromRow(rowByName(marketRows, /^外資及陸資\(不含外資自營商\)$/))
  const trust = amountFromRow(rowByName(marketRows, /^投信$/))
  const dealerSelf = amountFromRow(rowByName(marketRows, /^自營商\(自行買賣\)$/))
  const dealerHedge = amountFromRow(rowByName(marketRows, /^自營商\(避險\)$/))
  const dealer: InstitutionalAmount = {
    buyAmount: sumNullable(dealerSelf.buyAmount, dealerHedge.buyAmount),
    sellAmount: sumNullable(dealerSelf.sellAmount, dealerHedge.sellAmount),
    netAmount: sumNullable(dealerSelf.netAmount, dealerHedge.netAmount),
  }
  const total = amountFromRow(rowByName(marketRows, /^合計$/))
  const marketTotals: InstitutionalMarketTotals = { foreign, trust, dealer, total }
  for (const [key, value] of Object.entries(marketTotals)) if (Object.values(value).some((item) => item === null)) warnings.push(`${key} 市場金額欄位不完整。`)

  const indices = { symbol: fieldIndex(stockResponse, [/證券代號/, /股票代號/], 0), name: fieldIndex(stockResponse, [/證券名稱/, /股票名稱/], 1), foreign: fieldIndex(stockResponse, [/外陸資買賣超股數.*不含外資自營商/, /外資及陸資買賣超股數.*不含外資自營商/], 4), trust: fieldIndex(stockResponse, [/投信買賣超股數/], 10), dealer: fieldIndex(stockResponse, [/^自營商買賣超股數$/], 11), total: fieldIndex(stockResponse, [/三大法人買賣超股數/], 18) }
  const seen = new Set<string>()
  const records: OfficialStockInstitutionalRecord[] = stockRows.filter((row) => /^\d{4}$/.test(String(row[indices.symbol] ?? '').trim()) && !String(row[indices.symbol] ?? '').trim().startsWith('00')).map((row) => {
    const symbol = String(row[indices.symbol] ?? '').trim()
    const rowWarnings: string[] = []
    if (seen.has(symbol)) rowWarnings.push(`重複股票代號：${symbol}`)
    seen.add(symbol)
    const record = {
      symbol,
      name: String(row[indices.name] ?? '').trim(),
      foreignNetShares: parseInstitutionalNumber(row[indices.foreign]),
      trustNetShares: parseInstitutionalNumber(row[indices.trust]),
      dealerNetShares: parseInstitutionalNumber(row[indices.dealer]),
      totalNetShares: parseInstitutionalNumber(row[indices.total]),
      tradeDate,
      source: 'TWSE' as const,
      fetchedAt,
      status: 'official' as const,
      warnings: rowWarnings,
    }
    const missing = [record.foreignNetShares, record.trustNetShares, record.dealerNetShares, record.totalNetShares].some((value) => value === null)
    return missing ? { ...record, status: 'partial' as const, warnings: [...rowWarnings, '個股法人買賣超欄位不完整。'] } : record
  })
  if (!records.length) warnings.push('TWSE T86 未回傳個股法人資料。')
  if (records.length < 100) warnings.push(`個股法人資料筆數偏低：${records.length} 筆。`)
  const status = warnings.length || records.some((record) => record.status === 'partial') ? 'partial' : 'official'
  return {
    schemaVersion: '1.0', market: 'TWSE', tradeDate, fetchedAt,
    units: { marketTotals: 'TWD', stockNet: 'shares' }, marketTotals, records,
    source: {
      name: '臺灣證券交易所（TWSE）',
      marketEndpoint: 'https://www.twse.com.tw/rwd/zh/fund/BFI82U',
      stockEndpoint: 'https://www.twse.com.tw/rwd/zh/fund/T86',
    },
    status, warnings,
  }
}
