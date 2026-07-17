import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'public', 'data')
const OUTPUT = path.join(DATA, 'market-heatmap')
const CONFLICT_PATTERN = /<<<<<<<|=======|>>>>>>>/

export async function readSafeJson(file, fallback = null) {
  try {
    const text = await readFile(file, 'utf8')
    if (CONFLICT_PATTERN.test(text)) throw new Error(`${file} 包含 Git conflict marker`)
    if (text.includes('\uFFFD')) throw new Error(`${file} 包含 Unicode replacement character`)
    return JSON.parse(text)
  } catch (error) {
    if (error?.code === 'ENOENT' && fallback !== null) return fallback
    throw error
  }
}

export async function atomicWriteJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true })
  const temporary = `${file}.${process.pid}.tmp`
  const text = `${JSON.stringify(value, null, 2)}\n`
  if (CONFLICT_PATTERN.test(text) || text.includes('\uFFFD')) throw new Error(`拒絕寫入無效 JSON：${file}`)
  if (!file.endsWith('index.json') && !/[\u3400-\u9fff]/.test(text)) throw new Error(`拒絕寫入缺少可辨識中文內容的 JSON：${file}`)
  await writeFile(temporary, text, 'utf8')
  try {
    JSON.parse(await readFile(temporary, 'utf8'))
    await rename(temporary, file)
  } catch (error) {
    await unlink(temporary).catch(() => undefined)
    throw error
  }
}

export function buildIndustryMapping(input) {
  const mapping = new Map()
  for (const industry of input?.industries ?? []) {
    if (!industry?.id || !industry?.name) continue
    for (const stock of industry.stocks ?? []) {
      if (!/^\d{4}$/.test(stock.symbol ?? '') || mapping.has(stock.symbol)) continue
      mapping.set(stock.symbol, { industryId: industry.id, industryName: industry.name })
    }
  }
  return mapping
}

export function createHeatmapDataset({ stocksDataset, technicalDataset, screenerDataset, decisionDataset, industryInput }) {
  if (!stocksDataset?.tradeDate || !Array.isArray(stocksDataset.records)) throw new Error('twse-stocks/latest.json 結構不完整')
  const officialStocks = stocksDataset.records.filter((record) => record.instrumentType === 'stock' && /^\d{4}$/.test(record.symbol))
  const mapping = buildIndustryMapping(industryInput)
  const technical = new Map((technicalDataset?.records ?? []).map((record) => [record.symbol, record]))
  const screener = new Map()
  for (const row of screenerDataset?.results ?? []) {
    const current = screener.get(row.symbol)
    if (!current || (current.decisionScore === null && row.decisionScore !== null)) screener.set(row.symbol, row)
  }

  const mappedRecords = officialStocks.filter((record) => mapping.has(record.symbol))
  const mappedTradingAmount = mappedRecords.reduce((sum, record) => sum + (finiteOrNull(record.tradeValue) ?? 0), 0)
  const stockNodes = mappedRecords.map((record) => {
    const industry = mapping.get(record.symbol)
    const technicalRow = technical.get(record.symbol) ?? null
    const screenerRow = screener.get(record.symbol) ?? null
    const tradingAmount = finiteOrNull(record.tradeValue)
    const changePercent = calculateChangePercent(record.close, record.change)
    const warnings = ['產業分類使用既有 GULI 規則 mapping，並非 TWSE 官方產業欄位。']
    if (technicalRow?.technicalScore === null || !technicalRow) warnings.push('Technical Score 尚未取得。')
    if (screenerRow?.decisionScore === null || !screenerRow) warnings.push('Decision Score 尚未取得。')
    return {
      id: `stock:${record.symbol}`,
      type: 'stock',
      symbol: record.symbol,
      name: record.name,
      industryId: industry.industryId,
      industryName: industry.industryName,
      tradeDate: record.tradeDate,
      close: finiteOrNull(record.close),
      changePercent,
      tradingAmount,
      tradingVolume: finiteOrNull(record.tradeVolume),
      marketWeight: tradingAmount !== null && mappedTradingAmount > 0 ? round(tradingAmount / mappedTradingAmount * 100, 4) : null,
      sizeValue: tradingAmount,
      colorValue: changePercent,
      technicalScore: finiteOrNull(technicalRow?.technicalScore),
      decisionScore: finiteOrNull(screenerRow?.decisionScore),
      riskLevel: ['low', 'medium', 'high'].includes(technicalRow?.riskLevel) ? technicalRow.riskLevel : null,
      source: compact(['TWSE Official', 'Industry Mapping (Derived)', technicalRow ? 'Technical Index (Derived)' : null, screenerRow?.decisionScore !== null && screenerRow ? 'Decision Engine v1.0 (Derived)' : null]),
      status: 'mixed',
      warnings,
    }
  }).sort((left, right) => left.symbol.localeCompare(right.symbol))

  const groups = new Map()
  stockNodes.forEach((stock) => groups.set(stock.industryId, [...(groups.get(stock.industryId) ?? []), stock]))
  const industries = [...groups.entries()].map(([industryId, rows]) => {
    const tradingAmount = sum(rows, 'tradingAmount')
    const tradingVolume = sum(rows, 'tradingVolume')
    const changePercent = weightedMean(rows, 'changePercent', 'tradingAmount')
    return {
      id: `industry:${industryId}`,
      type: 'industry',
      symbol: null,
      name: rows[0].industryName,
      industryId,
      industryName: rows[0].industryName,
      tradeDate: stocksDataset.tradeDate,
      close: null,
      changePercent,
      tradingAmount,
      tradingVolume,
      marketWeight: mappedTradingAmount > 0 ? round(tradingAmount / mappedTradingAmount * 100, 4) : null,
      sizeValue: tradingAmount,
      colorValue: changePercent,
      technicalScore: weightedMean(rows, 'technicalScore', 'tradingAmount'),
      decisionScore: weightedMean(rows, 'decisionScore', 'tradingAmount'),
      riskLevel: aggregateRisk(rows),
      source: ['TWSE Official', 'Industry Mapping (Derived)', 'GULI Scores (Derived)'],
      status: 'mixed',
      warnings: ['產業節點由已完成分類的實際樣本彙總，不代表完整上市股票。'],
    }
  }).sort((left, right) => (right.tradingAmount ?? 0) - (left.tradingAmount ?? 0) || left.id.localeCompare(right.id))

  const mappedStockCount = stockNodes.length
  const totalStockUniverse = officialStocks.length
  const coverageRate = totalStockUniverse ? round(mappedStockCount / totalStockUniverse * 100, 2) : 0
  const generatedAt = latestTimestamp([
    stocksDataset.fetchedAt,
    technicalDataset?.generatedAt,
    screenerDataset?.generatedAt,
    decisionDataset?.generatedAt,
  ]) ?? `${stocksDataset.tradeDate}T13:30:00.000Z`
  const warnings = []
  if (coverageRate < 80) warnings.push(`目前僅呈現已完成分類的 ${mappedStockCount} 檔實際樣本，不代表全部 ${totalStockUniverse} 檔上市股票。`)
  if (technicalDataset?.tradeDate && technicalDataset.tradeDate !== stocksDataset.tradeDate) warnings.push('Technical Index 與個股盤後資料交易日期不同。')
  if (screenerDataset?.tradeDate && screenerDataset.tradeDate !== stocksDataset.tradeDate) warnings.push('Screener 與個股盤後資料交易日期不同。')
  return {
    schemaVersion: '1.0',
    tradeDate: stocksDataset.tradeDate,
    generatedAt,
    sampleSize: mappedStockCount,
    totalStockUniverse,
    mappedStockCount,
    unmappedStockCount: Math.max(0, totalStockUniverse - mappedStockCount),
    coverageRate,
    sizingMetric: 'tradingAmount',
    colorMetric: 'changePercent',
    industries,
    stocks: stockNodes,
    sourceSummary: {
      official: ['TWSE 個股盤後成交資料'],
      derived: ['既有 GULI 產業 mapping', 'Technical Index', 'Decision Engine v1.0'],
      mock: industryInput?.source?.type === 'mock' ? ['產業分類來源含既有 Mock／Derived 成分'] : [],
      missing: [`${Math.max(0, totalStockUniverse - mappedStockCount)} 檔尚未完成可靠產業分類`],
    },
    status: coverageRate >= 80 ? 'ready' : mappedStockCount ? 'partial' : 'missing',
    warnings,
  }
}

async function main() {
  const [stocksDataset, technicalDataset, screenerDataset, decisionDataset, industryInput] = await Promise.all([
    readSafeJson(path.join(DATA, 'twse-stocks', 'latest.json')),
    readSafeJson(path.join(DATA, 'technical-index', 'latest.json'), { records: [] }),
    readSafeJson(path.join(DATA, 'screener', 'latest.json'), { results: [] }),
    readSafeJson(path.join(DATA, 'decisions', 'latest.json'), {}),
    readSafeJson(path.join(DATA, 'industry-snapshot-input.json'), { industries: [] }),
  ])
  const output = createHeatmapDataset({ stocksDataset, technicalDataset, screenerDataset, decisionDataset, industryInput })
  await atomicWriteJson(path.join(OUTPUT, 'latest.json'), output)
  await atomicWriteJson(path.join(OUTPUT, 'history', `${output.tradeDate}.json`), output)
  const current = await readSafeJson(path.join(OUTPUT, 'index.json'), { schemaVersion: '1.0', dates: [] })
  const entry = { tradeDate: output.tradeDate, path: `data/market-heatmap/history/${output.tradeDate}.json`, sampleSize: output.sampleSize, coverageRate: output.coverageRate, status: output.status }
  const dates = [...(current.dates ?? []).filter((item) => item.tradeDate !== output.tradeDate), entry].sort((left, right) => left.tradeDate.localeCompare(right.tradeDate))
  await atomicWriteJson(path.join(OUTPUT, 'index.json'), { schemaVersion: '1.0', updatedAt: output.generatedAt, latestTradeDate: output.tradeDate, dates })
  console.log(`[heatmap] ${output.tradeDate}：樣本 ${output.sampleSize} 檔、已分類 ${output.mappedStockCount} 檔、未分類 ${output.unmappedStockCount} 檔、覆蓋率 ${output.coverageRate}%。`)
}

const finiteOrNull = (value) => typeof value === 'number' && Number.isFinite(value) ? value : null
const round = (value, digits = 2) => Number(value.toFixed(digits))
const compact = (values) => values.filter((value) => typeof value === 'string' && value.length > 0)
const sum = (rows, field) => rows.reduce((total, row) => total + (row[field] ?? 0), 0)
const calculateChangePercent = (close, change) => {
  if (!Number.isFinite(close) || !Number.isFinite(change)) return null
  const previous = close - change
  return previous > 0 ? round(change / previous * 100, 4) : null
}
const weightedMean = (rows, field, weightField) => {
  const available = rows.filter((row) => Number.isFinite(row[field]) && Number.isFinite(row[weightField]) && row[weightField] > 0)
  const totalWeight = available.reduce((total, row) => total + row[weightField], 0)
  return totalWeight ? round(available.reduce((total, row) => total + row[field] * row[weightField], 0) / totalWeight, 4) : null
}
const aggregateRisk = (rows) => rows.some((row) => row.riskLevel === 'high') ? 'high' : rows.some((row) => row.riskLevel === 'medium') ? 'medium' : rows.some((row) => row.riskLevel === 'low') ? 'low' : null
const latestTimestamp = (values) => values.filter((value) => typeof value === 'string' && Number.isFinite(Date.parse(value))).sort().at(-1) ?? null

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main().catch((error) => {
  console.error(`[heatmap] 產生失敗：${error instanceof Error ? error.stack ?? error.message : String(error)}`)
  process.exitCode = 1
})
