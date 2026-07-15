import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const DATA = resolve(process.cwd(), 'public/data')
const HISTORY = resolve(DATA, 'history')
const SCHEMA = '1.0'
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const statusFor = (value) => value <= 20 ? '\u6975\u5f31' : value <= 40 ? '\u504f\u5f31' : value <= 60 ? '\u4e2d\u6027' : value <= 80 ? '\u504f\u5f37' : '\u6975\u5f37'
const atomicWrite = async (path, value) => {
  const temporary = `${path}.${process.pid}.tmp`
  try { await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(temporary, path) }
  finally { await rm(temporary, { force: true }) }
}

function validateOfficial(data) {
  const errors = []
  if (data?.market !== 'TWSE' || !String(data.sourceUrl ?? '').includes('openapi.twse.com.tw')) errors.push('source is not an official TWSE endpoint')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data?.tradeDate ?? '')) errors.push('invalid trade date')
  if (!Number.isFinite(data?.indexValue) || data.indexValue <= 0) errors.push('invalid index value')
  if (!Number.isFinite(data?.tradingAmount) || data.tradingAmount < 0) errors.push('invalid trading amount')
  if (errors.length) throw new Error(errors.join('; '))
}

async function getIndustryData(tradeDate, analysis) {
  try {
    const snapshot = await readJson(resolve(DATA, `industry-history/${tradeDate}.json`))
    if (snapshot.schemaVersion !== '1.0' || snapshot.tradeDate !== tradeDate || !Array.isArray(snapshot.industries)) throw new Error('invalid industry snapshot schema')
    return {
      top: snapshot.industries.slice(0, 3).map((item) => ({ name: item.industryName, changePercent: item.return1d ?? 0, capitalFlow: item.capitalFlowScore, momentum: item.momentumScore, rank: item.rank, source: 'derived' })),
      weak: snapshot.industries.slice(-3).reverse().map((item, index) => ({ name: item.industryName, changePercent: item.return1d ?? 0, capitalFlow: item.capitalFlowScore, momentum: item.momentumScore, rank: index + 1, source: 'derived' })),
      source: { id: 'industry-snapshot', name: 'GULI Industry Snapshot Engine', type: 'derived', fields: ['topIndustries', 'weakIndustries'], tradeDate },
      warnings: [...(snapshot.warnings ?? [])],
    }
  } catch {
    return {
      top: analysis.topIndustries.slice(0, 3).map((item, index) => ({ ...item, rank: index + 1, source: 'fallback' })),
      weak: analysis.weakIndustries.slice(0, 3).map((item, index) => ({ ...item, rank: index + 1, source: 'fallback' })),
      source: { id: 'industry-fallback', name: analysis.source, type: 'fallback', fields: ['topIndustries', 'weakIndustries'] },
      warnings: ['Same-date Industry Snapshot was unavailable; industry rankings use fallback analysis.'],
    }
  }
}

async function getStockBreadth(tradeDate) {
  try {
    const index = await readJson(resolve(DATA, 'stock-history/latest.json'))
    if (index.schemaVersion !== '1.0' || index.tradeDate !== tradeDate || !Array.isArray(index.records)) throw new Error('invalid stock snapshot index')
    return {
      value: {
        strongCount: index.records.filter((item) => item.status === '\u5f37\u52e2' || item.status === '\u504f\u5f37').length,
        weakCount: index.records.filter((item) => item.status === '\u5f31\u52e2' || item.status === '\u504f\u5f31').length,
        highRiskCount: index.records.filter((item) => item.highRiskCount > 0).length,
      },
      source: { id: 'stock-snapshot', name: 'GULI Stock Snapshot Engine', type: 'derived', fields: ['stockBreadth'], tradeDate },
      warnings: [],
    }
  } catch {
    return { value: null, source: null, warnings: ['Same-date Stock Snapshot was unavailable; stock breadth is omitted.'] }
  }
}

async function main() {
  console.log('[GULI] Generating Market Snapshot.')
  const [official, analysis] = await Promise.all([readJson(resolve(DATA, 'twse-market-overview.json')), readJson(resolve(DATA, 'snapshot-analysis.json'))])
  validateOfficial(official)
  if (analysis?.schemaVersion !== SCHEMA || !Number.isFinite(analysis.marketTemperature)) throw new Error('invalid market analysis input')
  const temperature = Math.max(0, Math.min(100, analysis.marketTemperature))
  const industry = await getIndustryData(official.tradeDate, analysis)
  const stockBreadth = await getStockBreadth(official.tradeDate)
  const topIndustries = industry.top
  const weakIndustries = industry.weak.filter((item) => !topIndustries.some((top) => top.name === item.name))
  const snapshot = {
    schemaVersion: SCHEMA, snapshotId: `twse-${official.tradeDate}`, tradeDate: official.tradeDate, generatedAt: official.fetchedAt, market: 'TWSE', marketStatus: statusFor(temperature), marketTemperature: temperature,
    confidence: official.status === 'official' ? 82 : 72, headline: analysis.headline,
    overview: { indexValue: official.indexValue ?? null, change: official.change ?? null, changePercent: official.changePercent ?? null, tradingAmount: official.tradingAmount ?? null, advanceCount: official.advanceCount ?? null, declineCount: official.declineCount ?? null, unchangedCount: official.unchangedCount ?? null },
    stockBreadth: stockBreadth.value,
    topIndustries, weakIndustries, risks: analysis.risks.map((risk) => ({ ...risk, source: risk.id === 'breadth-partial' ? 'official' : 'derived' })), tags: [statusFor(temperature), ...topIndustries.slice(0, 2).map((item) => item.name)],
    sources: [{ id: 'twse-overview', name: official.source, type: 'official', fields: ['overview'], tradeDate: official.tradeDate, status: official.status }, industry.source, ...(stockBreadth.source ? [stockBreadth.source] : []), { id: 'guli-rules', name: 'GULI Rules Engine', type: 'derived', fields: ['marketStatus', 'confidence', 'headline', 'risks', 'tags'] }],
    warnings: [...(official.warnings ?? []), ...industry.warnings, ...stockBreadth.warnings, 'Market temperature and non-official fields still use mock data and deterministic rules.'],
  }
  const names = [...topIndustries, ...weakIndustries].map((item) => item.name)
  if (new Set(names).size !== names.length) throw new Error('strong and weak industries overlap')
  await mkdir(HISTORY, { recursive: true })
  const indexPath = resolve(HISTORY, 'index.json')
  let index = { schemaVersion: SCHEMA, updatedAt: snapshot.generatedAt, snapshots: [] }
  try { index = await readJson(indexPath) } catch (error) { if (error?.code !== 'ENOENT') throw error }
  const item = { tradeDate: snapshot.tradeDate, path: `data/history/${snapshot.tradeDate}.json`, marketStatus: snapshot.marketStatus, marketTemperature: snapshot.marketTemperature, headline: snapshot.headline }
  const snapshots = [item, ...index.snapshots.filter((entry) => entry.tradeDate !== snapshot.tradeDate)].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))
  await atomicWrite(resolve(HISTORY, `${snapshot.tradeDate}.json`), snapshot)
  await atomicWrite(resolve(HISTORY, 'latest.json'), snapshot)
  await atomicWrite(indexPath, { schemaVersion: SCHEMA, updatedAt: snapshot.generatedAt, snapshots })
  console.log(`[GULI] Market Snapshot complete: ${snapshot.tradeDate}; industry source=${industry.source.id}.`)
}

main().catch((error) => { console.error(`[GULI] Market Snapshot failed: ${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1 })
