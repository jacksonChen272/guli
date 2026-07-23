import { mkdir, readFile, readdir, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const HISTORY_DIR = path.join(ROOT, 'public', 'data', 'twse-stock-history', 'stocks')
const OUTPUT_ROOT = path.join(ROOT, 'public', 'data', 'technical-index')
const weights = { trend: 0.30, momentum: 0.20, volume: 0.15, macd: 0.15, position: 0.10, risk: 0.10 }
const clamp = (value) => Math.max(0, Math.min(100, value))
const round = (value, digits = 4) => value === null || !Number.isFinite(value) ? null : Number(value.toFixed(digits))
const mean = (values) => { const rows = values.filter((value) => value !== null && Number.isFinite(value)); return rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : null }
const last = (values) => values.at(-1) ?? null

async function readJson(file, fallback = null) { try { return JSON.parse(await readFile(file, 'utf8')) } catch (error) { if (error?.code === 'ENOENT') return fallback; throw error } }
async function atomicWrite(file, value) { await mkdir(path.dirname(file), { recursive: true }); const temp = `${file}.${process.pid}.tmp`; await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); try { JSON.parse(await readFile(temp, 'utf8')); await rename(temp, file) } catch (error) { await unlink(temp).catch(() => undefined); throw error } }

function sma(values, period) { return values.map((_, index) => index + 1 < period || values.slice(index + 1 - period, index + 1).some((value) => value === null) ? null : mean(values.slice(index + 1 - period, index + 1))) }
function ema(values, period) { const result = Array(values.length).fill(null); if (values.length < period || values.slice(0, period).some((value) => value === null)) return result; result[period - 1] = mean(values.slice(0, period)); const multiplier = 2 / (period + 1); for (let index = period; index < values.length; index += 1) if (values[index] !== null && result[index - 1] !== null) result[index] = (values[index] - result[index - 1]) * multiplier + result[index - 1]; return result }
function rolling(values, period, calculate) { return values.map((_, index) => index + 1 < period || values.slice(index + 1 - period, index + 1).some((value) => value === null) ? null : calculate(values.slice(index + 1 - period, index + 1))) }
function rsi(values, period = 14) { return values.map((_, index) => { if (index < period || values.slice(index - period, index + 1).some((value) => value === null)) return null; let gains = 0; let losses = 0; for (let cursor = index - period + 1; cursor <= index; cursor += 1) { const change = values[cursor] - values[cursor - 1]; gains += Math.max(change, 0); losses += Math.max(-change, 0) } return losses === 0 ? 100 : 100 - 100 / (1 + gains / losses) }) }
function stochastic(prices, period = 9) { const raw = prices.map((point, index) => { if (index + 1 < period || point.close === null) return null; const window = prices.slice(index + 1 - period, index + 1); if (window.some((row) => row.high === null || row.low === null)) return null; const high = Math.max(...window.map((row) => row.high)); const low = Math.min(...window.map((row) => row.low)); return high === low ? 50 : (point.close - low) / (high - low) * 100 }); const k = sma(raw, 3); const d = sma(k, 3); return { k, d } }
function volatility(closes, period = 20) { return closes.map((_, index) => { if (index < period) return null; const window = closes.slice(index - period, index + 1); if (window.some((value) => value === null || value <= 0)) return null; const returns = window.slice(1).map((value, cursor) => value / window[cursor] - 1); const average = mean(returns); return Math.sqrt(mean(returns.map((value) => (value - average) ** 2))) * Math.sqrt(252) * 100 }) }
function atr(prices, period = 14) { const ranges = prices.map((point, index) => point.high === null || point.low === null ? null : index === 0 || prices[index - 1].close === null ? point.high - point.low : Math.max(point.high - point.low, Math.abs(point.high - prices[index - 1].close), Math.abs(point.low - prices[index - 1].close))); return sma(ranges, period) }
function slope(values, lookback = 5) { if (values.length <= lookback || last(values) === null || values.at(-1 - lookback) === null || values.at(-1 - lookback) === 0) return null; return (last(values) / values.at(-1 - lookback) - 1) * 100 }
function score(values) { const rows = values.filter((value) => value !== null); return rows.length ? mean(rows) : null }
const binary = (condition, positive = 80, negative = 30) => condition === null ? null : condition ? positive : negative
const compare = (left, right, positive = 80, negative = 30) => left === null || right === null ? null : binary(left > right, positive, negative)

function technicalScore(entry) {
  const factors = {
    trend: score([compare(entry.close, entry.ma20), compare(entry.close, entry.ma60), binary(entry.ma20Slope === null ? null : entry.ma20Slope > 0), binary(entry.ma60Slope === null ? null : entry.ma60Slope > 0), compare(entry.ma5, entry.ma20)]),
    momentum: score([entry.rsi14 === null ? null : entry.rsi14 >= 55 && entry.rsi14 <= 75 ? 82 : entry.rsi14 > 80 ? 32 : entry.rsi14 < 35 ? 38 : 60, compare(entry.k, entry.d, 75, 38), entry.return20 === null ? null : clamp(50 + entry.return20 * 2.5)]),
    volume: entry.volumeRatio === null || entry.changePercent === null ? null : clamp(50 + Math.min(entry.volumeRatio, 3) * 14 + Math.sign(entry.changePercent) * 12),
    macd: score([compare(entry.macd, entry.macdSignal, 78, 35), entry.macdHistogram === null ? null : clamp(50 + entry.macdHistogram * 8)]),
    position: entry.close === null || entry.bollingerUpper === null || entry.bollingerLower === null || entry.bollingerUpper === entry.bollingerLower ? null : clamp(100 - Math.abs(((entry.close - entry.bollingerLower) / (entry.bollingerUpper - entry.bollingerLower)) - 0.68) * 95),
    risk: score([entry.volatility20 === null ? null : clamp(100 - Math.max(0, entry.volatility20 - 15) * 1.7), entry.atr14 === null || entry.close === null || entry.close <= 0 ? null : clamp(100 - Math.max(0, entry.atr14 / entry.close * 100 - 1.5) * 18), entry.rsi14 === null ? null : entry.rsi14 >= 80 ? 25 : entry.rsi14 >= 70 ? 55 : 82, binary(entry.aboveMa20, 82, 38), binary(entry.aboveMa60, 85, 32)]),
  }
  const availableWeight = Object.entries(weights).reduce((sum, [key, weight]) => sum + (factors[key] === null ? 0 : weight), 0)
  return { score: availableWeight < 0.5 ? null : round(Object.entries(weights).reduce((sum, [key, weight]) => sum + (factors[key] === null ? 0 : factors[key] * weight / availableWeight), 0), 1), confidence: Math.round(availableWeight * 100), factors }
}

function calculate(dataset) {
  const prices = dataset.prices
  const closes = prices.map((point) => point.close)
  const volumes = prices.map((point) => point.volume)
  const ma5 = sma(closes, 5), ma10 = sma(closes, 10), ma20 = sma(closes, 20), ma60 = sma(closes, 60), ma120 = sma(closes, 120)
  const averageVolume20 = sma(volumes, 20)
  const ema12 = ema(closes, 12), ema26 = ema(closes, 26)
  const macd = ema12.map((value, index) => value === null || ema26[index] === null ? null : value - ema26[index])
  const macdSignal = ema(macd.filter((value) => value !== null), 9)
  const signalFull = Array(Math.max(0, macd.length - macdSignal.length)).fill(null).concat(macdSignal)
  const histogram = macd.map((value, index) => value === null || signalFull[index] === null ? null : value - signalFull[index])
  const rsi14 = rsi(closes)
  const kd = stochastic(prices)
  const middle = ma20
  const deviations = rolling(closes, 20, (window) => { const average = mean(window); return Math.sqrt(mean(window.map((value) => (value - average) ** 2))) })
  const upper = middle.map((value, index) => value === null || deviations[index] === null ? null : value + 2 * deviations[index])
  const lower = middle.map((value, index) => value === null || deviations[index] === null ? null : value - 2 * deviations[index])
  const atr14 = atr(prices)
  const returnAt = (period) => closes.length <= period || last(closes) === null || closes.at(-1 - period) === null || closes.at(-1 - period) === 0 ? null : (last(closes) / closes.at(-1 - period) - 1) * 100
  const volatility20 = last(volatility(closes))
  const close = last(closes), previousClose = closes.at(-2) ?? null
  const structureWindow = prices.slice(-60)
  const validLows = structureWindow.map((point) => point.low).filter((value) => value !== null && Number.isFinite(value))
  const validHighs = structureWindow.map((point) => point.high).filter((value) => value !== null && Number.isFinite(value))
  const support = validLows.length ? Math.min(...validLows) : null
  const resistance = validHighs.length ? Math.max(...validHighs) : null
  let macdCrossDays = null
  for (let days = 0; days <= 3 && macd.length - 1 - days > 0; days += 1) { const index = macd.length - 1 - days; if (macd[index] !== null && signalFull[index] !== null && macd[index - 1] !== null && signalFull[index - 1] !== null && macd[index] > signalFull[index] && macd[index - 1] <= signalFull[index - 1]) { macdCrossDays = days; break } }
  const base = {
    symbol: dataset.symbol, name: dataset.name, tradeDate: dataset.lastTradeDate, historyRecordCount: dataset.recordCount,
    close, change: last(prices)?.change ?? (close !== null && previousClose !== null ? close - previousClose : null), changePercent: close !== null && previousClose !== null && previousClose !== 0 ? (close / previousClose - 1) * 100 : null,
    volume: last(volumes), averageVolume20: last(averageVolume20), volumeRatio: last(volumes) !== null && last(averageVolume20) ? last(volumes) / last(averageVolume20) : null,
    ma5: last(ma5), ma10: last(ma10), ma20: last(ma20), ma60: last(ma60), ma120: last(ma120), ema12: last(ema12), ema26: last(ema26), rsi14: last(rsi14), k: last(kd.k), d: last(kd.d),
    macd: last(macd), macdSignal: last(signalFull), macdHistogram: last(histogram), bollingerUpper: last(upper), bollingerMiddle: last(middle), bollingerLower: last(lower), atr14: last(atr14),
    return20: returnAt(20), return60: returnAt(60), volatility20, aboveMa20: close === null || last(ma20) === null ? null : close > last(ma20), aboveMa60: close === null || last(ma60) === null ? null : close > last(ma60), ma20Slope: slope(ma20), ma60Slope: slope(ma60), macdCrossDays,
    kdImproving: last(kd.k) === null || last(kd.d) === null ? null : last(kd.k) > last(kd.d) || (kd.k.at(-2) !== null && last(kd.k) > kd.k.at(-2)), support, resistance,
  }
  const scored = technicalScore(base)
  const signalIds = []
  if (base.aboveMa20) signalIds.push('above-ma20')
  if (base.volumeRatio !== null && base.volumeRatio >= 1.5) signalIds.push('volume-expansion')
  if (macdCrossDays !== null) signalIds.push('macd-golden-cross')
  if (base.rsi14 !== null && base.rsi14 >= 70) signalIds.push('rsi-overheated')
  const riskLevel = (base.rsi14 !== null && base.rsi14 >= 75) || (base.atr14 !== null && close !== null && close > 0 && base.atr14 / close >= 0.04) || base.aboveMa60 === false ? 'high' : (volatility20 ?? 0) >= 35 ? 'medium' : 'low'
  return Object.fromEntries(Object.entries({ ...base, signalIds, technicalScore: scored.score, technicalConfidence: scored.confidence, technicalLabel: scored.score === null ? '資料不足' : scored.score >= 81 ? '強勢' : scored.score >= 66 ? '偏強' : scored.score >= 51 ? '中性' : scored.score >= 36 ? '偏弱' : '弱勢', riskLevel, source: 'TWSE Official History', status: dataset.status === 'stale' ? 'stale' : dataset.recordCount < 250 || scored.score === null ? 'partial' : 'official', warnings: dataset.warnings ?? [] }).map(([key, value]) => [key, typeof value === 'number' ? round(value) : value]))
}

async function main() {
  const files = (await readdir(HISTORY_DIR).catch(() => [])).filter((file) => /^\d{4}\.json$/.test(file)).sort()
  const records = []
  const warnings = []
  for (const file of files) {
    try { const dataset = await readJson(path.join(HISTORY_DIR, file)); if (!dataset?.prices?.length || dataset.source !== 'TWSE') { warnings.push(`${file}: 非有效 TWSE 歷史資料`); continue } records.push(calculate(dataset)) }
    catch (error) { warnings.push(`${file}: ${error instanceof Error ? error.message : String(error)}`) }
  }
  const tradeDate = records.map((record) => record.tradeDate).filter(Boolean).sort().at(-1) ?? null
  const output = { schemaVersion: '1.0', formulaVersion: 'technical-v1.0', tradeDate, generatedAt: new Date().toISOString(), source: 'TWSE Official History', sampleCount: records.length, complete250Count: records.filter((record) => record.historyRecordCount >= 250).length, scoreAvailableCount: records.filter((record) => record.technicalScore !== null).length, staleCount: records.filter((record) => record.status === 'stale').length, records, warnings }
  await atomicWrite(path.join(OUTPUT_ROOT, 'latest.json'), output)
  if (tradeDate) await atomicWrite(path.join(OUTPUT_ROOT, 'history', `${tradeDate}.json`), output)
  const existing = await readJson(path.join(OUTPUT_ROOT, 'index.json'), { schemaVersion: '1.0', dates: [] })
  const dates = [...new Set([...(existing.dates ?? []), ...(tradeDate ? [tradeDate] : [])])].sort()
  await atomicWrite(path.join(OUTPUT_ROOT, 'index.json'), { schemaVersion: '1.0', formulaVersion: 'technical-v1.0', updatedAt: output.generatedAt, latestTradeDate: tradeDate, dates, sampleCount: records.length })
  console.log(`[technical-index] ${records.length} 檔、250 日完整 ${output.complete250Count} 檔、Technical Score 可用 ${output.scoreAvailableCount} 檔。`)
  if (!records.length) process.exitCode = 1
}

main().catch((error) => { console.error(`[technical-index] 失敗：${error instanceof Error ? error.stack ?? error.message : String(error)}`); process.exitCode = 1 })
