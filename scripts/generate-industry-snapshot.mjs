import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ROOT = process.cwd(); const DATA = resolve(ROOT, 'public/data'); const HISTORY = resolve(DATA, 'industry-history'); const SCHEMA = '1.0'
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'))
const clamp = (value) => Math.max(0, Math.min(100, Math.round(value)))
const average = (values) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const statusFor = (value) => value >= 81 ? '強勢' : value >= 66 ? '偏強' : value >= 51 ? '中性' : value >= 36 ? '偏弱' : '弱勢'
const atomicWrite = async (path, value) => { const temporary = `${path}.${process.pid}.tmp`; try { await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); await rename(temporary, path) } finally { await rm(temporary, { force: true }) } }
const sourceMock = { id: 'guli-industry-input', name: 'GULI Mock Data', type: 'mock', fields: ['returns', 'institutionalNetBuy', 'tradingAmount', 'breadth', 'leaders'] }
const sourceDerived = { id: 'guli-industry-rules', name: 'GULI Industry Snapshot Engine', type: 'derived', fields: ['scores', 'rank', 'status', 'risks'] }

function buildIndustry(industry, marketReturn, warnings) {
  const stocks = Array.isArray(industry.stocks) ? industry.stocks : []
  if (!stocks.length) warnings.push(`${industry.name} 缺少成分股資料，採中性分數。`)
  const return1d = stocks.length ? average(stocks.map((stock) => stock.changePercent)) : null
  const return5d = stocks.length ? average(stocks.map((stock) => stock.return5d)) : null
  const return20d = stocks.length ? average(stocks.map((stock) => stock.return20d)) : null
  const advanceCount = stocks.length ? stocks.filter((stock) => stock.changePercent > 0).length : null
  const declineCount = stocks.length ? stocks.filter((stock) => stock.changePercent < 0).length : null
  const unchangedCount = stocks.length ? stocks.length - advanceCount - declineCount : null
  const institutionalNetBuy = stocks.length ? stocks.reduce((sum, stock) => sum + stock.institutionalNetBuy, 0) : null
  const tradingAmount = stocks.length ? stocks.reduce((sum, stock) => sum + stock.tradingAmount, 0) : null
  const breadthScore = clamp(stocks.length ? (advanceCount + unchangedCount * .5) / stocks.length * 100 : 50)
  const capitalFlowScore = clamp(50 + industry.capitalFlow * 1.5 + (institutionalNetBuy ?? 0) / Math.max(25, stocks.length * 35))
  const momentumScore = clamp(50 + (return5d ?? 0) * 4 + (return20d ?? 0) * 1.5 + industry.momentum * 1.2)
  const relativeStrengthScore = clamp(50 + ((return1d ?? 0) - marketReturn) * 10 + (average(stocks.map((stock) => stock.healthScore)) - 50) * .35)
  const avgVolatility = average(stocks.map((stock) => stock.volatility)); const overheatRatio = stocks.length ? stocks.filter((stock) => stock.rsi > 75).length / stocks.length : 0
  const riskAdjustment = clamp(100 - avgVolatility * 12 - overheatRatio * 30); const riskScore = 100 - riskAdjustment
  const strengthScore = clamp(capitalFlowScore * .30 + momentumScore * .25 + breadthScore * .20 + relativeStrengthScore * .15 + riskAdjustment * .10)
  const ranked = stocks.map(({ symbol, name, changePercent, healthScore }) => ({ symbol, name, changePercent, healthScore })).sort((a, b) => b.changePercent - a.changePercent)
  const leaderStocks = ranked.slice(0, Math.min(3, Math.ceil(ranked.length / 2))); const leaders = new Set(leaderStocks.map((stock) => stock.symbol)); const laggardStocks = [...ranked].reverse().filter((stock) => !leaders.has(stock.symbol)).slice(0, Math.min(3, Math.floor(ranked.length / 2)))
  const risks = [avgVolatility > 2.2 ? '產業波動偏高' : '', overheatRatio >= .5 ? '成分股短線過熱' : '', institutionalNetBuy !== null && institutionalNetBuy < 0 ? '法人資金淨流出' : ''].filter(Boolean)
  return { industryId: industry.id, industryName: industry.name, rank: 0, previousRank: null, rankChange: null, strengthScore, momentumScore, capitalFlowScore, breadthScore, relativeStrengthScore, riskScore, status: statusFor(strengthScore), direction: 'flat', return1d, return5d, return20d, institutionalNetBuy, tradingAmount, advanceCount, declineCount, unchangedCount, leaderStocks, laggardStocks, risks, tags: [statusFor(strengthScore), capitalFlowScore >= 66 ? '資金流入' : capitalFlowScore <= 35 ? '資金流出' : '資金中性'], sources: [sourceMock, sourceDerived] }
}

function validate(snapshot) {
  const errors = []; if (snapshot.schemaVersion !== SCHEMA) errors.push('schemaVersion 不相容'); if (!/^\d{4}-\d{2}-\d{2}$/.test(snapshot.tradeDate)) errors.push('交易日期無效')
  const ranks = snapshot.industries.map((item) => item.rank); if (new Set(ranks).size !== ranks.length || ranks.some((rank, index) => rank !== index + 1)) errors.push('排名必須由 1 開始且不得重複')
  for (const item of snapshot.industries) { for (const field of ['strengthScore','momentumScore','capitalFlowScore','breadthScore','relativeStrengthScore','riskScore']) if (!Number.isFinite(item[field]) || item[field] < 0 || item[field] > 100) errors.push(`${item.industryName}.${field} 無效`); if (item.leaderStocks.some((stock) => item.laggardStocks.some((other) => other.symbol === stock.symbol))) errors.push(`${item.industryName} 領漲與落後股票重複`) }
  if (errors.length) throw new Error(errors.join('；'))
}

async function main() {
  console.log('[GULI] 開始產生 Industry Snapshot。')
  const [overview, input] = await Promise.all([readJson(resolve(DATA, 'twse-market-overview.json')), readJson(resolve(DATA, 'industry-snapshot-input.json'))])
  if (input.schemaVersion !== SCHEMA || !Array.isArray(input.industries)) throw new Error('產業輸入資料格式錯誤')
  const marketReturn = Number.isFinite(overview.changePercent) ? overview.changePercent : average(input.industries.flatMap((item) => item.stocks.map((stock) => stock.changePercent)))
  await mkdir(HISTORY, { recursive: true }); const indexPath = resolve(HISTORY, 'index.json'); let index = { schemaVersion: SCHEMA, updatedAt: overview.fetchedAt, snapshots: [] }
  try { index = await readJson(indexPath) } catch (error) { if (error?.code !== 'ENOENT') throw error }
  const previousDate = index.snapshots.find((item) => item.tradeDate < overview.tradeDate)?.tradeDate; let previous = null
  if (previousDate) try { previous = await readJson(resolve(HISTORY, `${previousDate}.json`)) } catch { previous = null }
  const warnings = ['產業、個股與法人欄位目前為集中管理的模擬資料；TWSE 僅提供本快照交易日期。']
  const industries = input.industries.map((industry) => buildIndustry(industry, marketReturn, warnings)).sort((a, b) => b.strengthScore - a.strengthScore || a.industryName.localeCompare(b.industryName, 'zh-Hant')).map((item, index) => { const rank = index + 1; const previousRank = previous?.industries.find((value) => value.industryId === item.industryId)?.rank ?? null; const rankChange = previousRank === null ? null : previousRank - rank; return { ...item, rank, previousRank, rankChange, direction: rankChange === null || rankChange === 0 ? 'flat' : rankChange > 0 ? 'up' : 'down' } })
  const snapshot = { schemaVersion: SCHEMA, tradeDate: overview.tradeDate, generatedAt: overview.fetchedAt, market: 'TWSE', industries, sources: [{ id: 'twse-trade-date', name: overview.source, type: overview.status === 'fallback' ? 'fallback' : 'official', fields: ['tradeDate'], tradeDate: overview.tradeDate }, sourceMock, sourceDerived], warnings }
  validate(snapshot)
  const item = { tradeDate: snapshot.tradeDate, path: `data/industry-history/${snapshot.tradeDate}.json`, topIndustries: industries.slice(0, 3).map((value) => value.industryName), weakIndustries: industries.slice(-3).reverse().map((value) => value.industryName) }
  const snapshots = [item, ...index.snapshots.filter((value) => value.tradeDate !== snapshot.tradeDate)].sort((a, b) => b.tradeDate.localeCompare(a.tradeDate))
  const nextIndex = { schemaVersion: SCHEMA, updatedAt: snapshot.generatedAt, snapshots }
  await atomicWrite(resolve(HISTORY, `${snapshot.tradeDate}.json`), snapshot); await atomicWrite(resolve(HISTORY, 'latest.json'), snapshot); await atomicWrite(indexPath, nextIndex)
  console.log(`[GULI] Industry Snapshot 完成：${snapshot.tradeDate}，${industries.length} 個產業，歷史 ${snapshots.length} 筆。`)
}
main().catch((error) => { console.error(`[GULI] Industry Snapshot 失敗：${error instanceof Error ? error.message : String(error)}`); process.exitCode = 1 })
