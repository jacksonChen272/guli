import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const ROOT = process.cwd()
const OFFICIAL_PATH = resolve(ROOT, 'public/data/twse-market-overview.json')
const ANALYSIS_PATH = resolve(ROOT, 'public/data/snapshot-analysis.json')
const HISTORY_DIR = resolve(ROOT, 'public/data/history')
const SCHEMA = '1.0'

const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const statusFor = (value) => value <= 20 ? '極弱' : value <= 40 ? '偏弱' : value <= 60 ? '中性' : value <= 80 ? '偏強' : '極強'
const industry = (value, rank) => ({ ...value, rank, source: 'mock' })
const atomicWrite = async (path, value) => { const temporary = `${path}.${process.pid}.tmp`; try { await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(temporary, path) } finally { await rm(temporary, { force: true }) } }

function validateOfficial(data) {
  const errors = []
  if (data?.market !== 'TWSE' || !String(data.sourceUrl ?? '').includes('openapi.twse.com.tw')) errors.push('缺少 TWSE 官方來源')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data?.tradeDate ?? '')) errors.push('交易日期無效')
  if (!Number.isFinite(data?.indexValue) || data.indexValue <= 0) errors.push('官方指數值無效')
  if (!Number.isFinite(data?.tradingAmount) || data.tradingAmount < 0) errors.push('官方成交金額無效')
  if (!Number.isFinite(Date.parse(data?.fetchedAt ?? ''))) errors.push('官方抓取時間無效')
  if (data?.status === 'fallback') errors.push('官方資料目前為 fallback')
  if (errors.length) throw new Error(errors.join('、'))
}
function validateSnapshot(snapshot) {
  const errors = []
  if (snapshot.schemaVersion !== SCHEMA) errors.push('schemaVersion 無效')
  if (snapshot.marketTemperature < 0 || snapshot.marketTemperature > 100) errors.push('市場溫度超出範圍')
  if (snapshot.confidence < 0 || snapshot.confidence > 100) errors.push('信心程度超出範圍')
  const top = snapshot.topIndustries.map((item) => item.name); const weak = snapshot.weakIndustries.map((item) => item.name)
  if (new Set(top).size !== top.length || new Set(weak).size !== weak.length || top.some((name) => weak.includes(name))) errors.push('產業強弱榜重複')
  if (!snapshot.sources.length) errors.push('sources 不可為空')
  if (errors.length) throw new Error(errors.join('、'))
}

async function main() {
  console.log('[GULI] 開始產生 Market Snapshot…')
  const [official, analysis] = await Promise.all([readJson(OFFICIAL_PATH), readJson(ANALYSIS_PATH)])
  validateOfficial(official)
  if (analysis?.schemaVersion !== SCHEMA || !Number.isFinite(analysis.marketTemperature)) throw new Error('Snapshot 分析資料格式無效')
  const temperature = Math.max(0, Math.min(100, analysis.marketTemperature))
  const topIndustries = analysis.topIndustries.slice(0, 3).map((item, index) => industry(item, index + 1))
  const weakIndustries = analysis.weakIndustries.filter((item) => !topIndustries.some((top) => top.name === item.name)).slice(0, 3).map((item, index) => industry(item, index + 1))
  const snapshot = {
    schemaVersion: SCHEMA, snapshotId: `twse-${official.tradeDate}`, tradeDate: official.tradeDate, generatedAt: official.fetchedAt,
    market: 'TWSE', marketStatus: statusFor(temperature), marketTemperature: temperature,
    confidence: official.status === 'official' ? 82 : 72, headline: analysis.headline,
    overview: { indexValue: official.indexValue ?? null, change: official.change ?? null, changePercent: official.changePercent ?? null, tradingAmount: official.tradingAmount ?? null, advanceCount: official.advanceCount ?? null, declineCount: official.declineCount ?? null, unchangedCount: official.unchangedCount ?? null },
    topIndustries, weakIndustries, risks: analysis.risks.map((risk) => ({ ...risk, source: risk.id === 'breadth-partial' ? 'official' : 'derived' })),
    tags: [statusFor(temperature), ...topIndustries.slice(0, 2).map((item) => item.name)],
    sources: [
      { id: 'twse-overview', name: official.source, type: 'official', fields: ['overview'], tradeDate: official.tradeDate, status: official.status },
      { id: 'guli-analysis', name: analysis.source, type: 'mock', fields: ['marketTemperature', 'topIndustries', 'weakIndustries'] },
      { id: 'guli-rules', name: 'GULI 規則引擎', type: 'derived', fields: ['marketStatus', 'confidence', 'headline', 'risks', 'tags'] }
    ],
    warnings: [...(official.warnings ?? []), '產業、法人、訊號與市場溫度仍使用模擬或規則推導資料。']
  }
  validateSnapshot(snapshot)
  await mkdir(HISTORY_DIR, { recursive: true })
  const indexPath = resolve(HISTORY_DIR, 'index.json')
  let index = { schemaVersion: SCHEMA, updatedAt: snapshot.generatedAt, snapshots: [] }
  try { index = await readJson(indexPath) } catch (error) { if (error?.code !== 'ENOENT') throw error }
  const item = { tradeDate: snapshot.tradeDate, path: `data/history/${snapshot.tradeDate}.json`, marketStatus: snapshot.marketStatus, marketTemperature: snapshot.marketTemperature, headline: snapshot.headline }
  const snapshots = [item, ...(Array.isArray(index.snapshots) ? index.snapshots.filter((entry) => entry.tradeDate !== snapshot.tradeDate) : [])].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))
  const nextIndex = { schemaVersion: SCHEMA, updatedAt: snapshot.generatedAt, snapshots }
  await atomicWrite(resolve(HISTORY_DIR, `${snapshot.tradeDate}.json`), snapshot)
  await atomicWrite(resolve(HISTORY_DIR, 'latest.json'), snapshot)
  await atomicWrite(indexPath, nextIndex)
  console.log(`[GULI] Snapshot 成功：${snapshot.tradeDate}｜${snapshot.marketStatus}｜${snapshot.marketTemperature} 分｜共 ${snapshots.length} 筆歷史`)
}
main().catch((error) => { console.error(`[GULI] Snapshot 失敗，未產生假官方資料：${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1 })
