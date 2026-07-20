import type { OfficialIndustryMappingDataset, OfficialIndustryStock } from '../../types/officialIndustryMapping'

export interface RawTWSECompanyRecord {
  [key: string]: unknown
}

export interface IndustryUniverseStock {
  symbol: string
  name: string
  instrumentType: string
  market?: string
}

export const TWSE_INDUSTRY_NAMES: Readonly<Record<string, string>> = Object.freeze({
  '01': '水泥工業', '02': '食品工業', '03': '塑膠工業', '04': '紡織纖維', '05': '電機機械', '06': '電器電纜',
  '08': '玻璃陶瓷', '09': '造紙工業', '10': '鋼鐵工業', '11': '橡膠工業', '12': '汽車工業', '14': '建材營造',
  '15': '航運業', '16': '觀光餐旅', '17': '金融保險', '18': '貿易百貨', '19': '綜合', '20': '其他',
  '21': '化學工業', '22': '生技醫療業', '23': '油電燃氣業', '24': '半導體業', '25': '電腦及週邊設備業',
  '26': '光電業', '27': '通信網路業', '28': '電子零組件業', '29': '電子通路業', '30': '資訊服務業',
  '31': '其他電子業', '35': '綠能環保', '36': '數位雲端', '37': '運動休閒', '38': '居家生活',
})

const text = (value: unknown) => typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
const field = (record: RawTWSECompanyRecord, names: string[]) => names.map((name) => record[name]).find((value) => text(value).length > 0)

export function normalizeRocDate(value: unknown): string | null {
  const raw = text(value).replace(/[^0-9]/g, '')
  if (/^\d{7}$/.test(raw)) {
    const year = Number(raw.slice(0, 3)) + 1911
    const result = `${year}-${raw.slice(3, 5)}-${raw.slice(5, 7)}`
    return Number.isFinite(Date.parse(`${result}T00:00:00Z`)) ? result : null
  }
  if (/^\d{8}$/.test(raw)) {
    const result = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
    return Number.isFinite(Date.parse(`${result}T00:00:00Z`)) ? result : null
  }
  return null
}

export function normalizeIndustryCode(value: unknown) {
  const raw = text(value).replace(/\D/g, '')
  return /^\d{1,2}$/.test(raw) ? raw.padStart(2, '0') : null
}

export function normalizeTWSEIndustryMapping(
  records: RawTWSECompanyRecord[],
  universe: IndustryUniverseStock[],
  options: { fetchedAt: string; sourceUrl: string; fallbackEffectiveDate?: string },
): OfficialIndustryMappingDataset {
  const fetchedDate = options.fallbackEffectiveDate ?? options.fetchedAt.slice(0, 10)
  const effectiveDates = records.map((record) => normalizeRocDate(field(record, ['出表日期', '資料日期', 'Date']))).filter((value): value is string => Boolean(value))
  const effectiveDate = [...new Set(effectiveDates)].sort().at(-1) ?? fetchedDate
  const rawBySymbol = new Map<string, RawTWSECompanyRecord>()
  for (const record of records) {
    const symbol = text(field(record, ['公司代號', '公司代碼', '股票代號', 'Code']))
    if (/^\d{4}$/.test(symbol) && !rawBySymbol.has(symbol)) rawBySymbol.set(symbol, record)
  }

  const eligible = universe.filter((stock) => {
    if (stock.market === 'TPEX' || stock.instrumentType !== 'stock' || !/^\d{4}$/.test(stock.symbol)) return false
    const raw = rawBySymbol.get(stock.symbol)
    return normalizeIndustryCode(field(raw ?? {}, ['產業別', '產業代號', 'Industry'])) !== '91'
  })
  const warnings: string[] = []
  const stocks: OfficialIndustryStock[] = eligible.map((stock) => {
    const raw = rawBySymbol.get(stock.symbol)
    const code = raw ? normalizeIndustryCode(field(raw, ['產業別', '產業代號', 'Industry'])) : null
    const industryName = code ? TWSE_INDUSTRY_NAMES[code] ?? null : null
    if (code && !industryName) warnings.push(`${stock.symbol} 的官方產業代碼 ${code} 尚未納入支援表。`)
    return {
      symbol: stock.symbol,
      name: text(field(raw ?? {}, ['公司簡稱', '公司名稱', '股票名稱', 'Name'])) || stock.name,
      market: 'TWSE' as const,
      instrumentType: 'stock' as const,
      industryCode: industryName ? code : null,
      industryName,
      source: 'TWSE' as const,
      status: industryName ? 'official' as const : 'missing' as const,
      updatedAt: options.fetchedAt,
    }
  }).sort((left, right) => left.symbol.localeCompare(right.symbol))

  const counts = new Map<string, number>()
  stocks.forEach((stock) => { if (stock.industryCode) counts.set(stock.industryCode, (counts.get(stock.industryCode) ?? 0) + 1) })
  const industries = [...counts.entries()].map(([industryCode, stockCount]) => ({ industryCode, industryName: TWSE_INDUSTRY_NAMES[industryCode], stockCount, source: 'TWSE' as const, status: 'official' as const })).sort((a, b) => a.industryCode.localeCompare(b.industryCode))
  const mappedStockCount = stocks.filter((stock) => stock.status === 'official').length
  const unmappedStockCount = stocks.length - mappedStockCount
  if (unmappedStockCount) warnings.push(`${unmappedStockCount} 檔普通股尚未取得可驗證的官方產業分類，保留為未分類。`)
  return {
    schemaVersion: '1.0', market: 'TWSE', source: 'TWSE', sourceUrl: options.sourceUrl,
    fetchedAt: options.fetchedAt, effectiveDate, totalRecords: records.length, stockRecords: stocks.length,
    excludedRecords: Math.max(0, records.length - stocks.filter((stock) => rawBySymbol.has(stock.symbol)).length),
    mappedStockCount, unmappedStockCount, status: unmappedStockCount ? 'partial' : 'official',
    warnings: [...new Set(warnings)], industries, stocks,
  }
}
