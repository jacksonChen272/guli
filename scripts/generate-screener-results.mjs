import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT = process.cwd()
const DATA = path.join(ROOT, 'public', 'data')
const OUT = path.join(DATA, 'screener')
const presets = [
  ['strong-trend', '強勢趨勢', '收盤站上中期均線、均線向上且動能未過熱。'],
  ['breakout-volume', '突破量增', '價格站上 MA20，量比放大且 MACD 柱狀體改善。'],
  ['macd-golden-cross', 'MACD 黃金交叉', '最近三個交易日出現黃金交叉，價格仍守住 MA20。'],
  ['institution-technical', '法人與技術同步', '官方法人買超與技術結構同向，且資料日期在允許範圍。'],
  ['oversold-rebound', '超跌反彈觀察', 'RSI 低檔且 KD 改善；僅列入高風險觀察。'],
  ['low-volatility-trend', '低波動趨勢', '中期均線向上、波動率低於樣本中位數且 RSI 未過熱。'],
  ['high-volume-momentum', '高成交動能', '量比至少兩倍、20 日報酬為正且收盤高於 MA20。'],
  ['defensive-watch', '防守型觀察', '波動率偏低、收盤守住 MA60，且 RSI 位於 45–65。'],
  ['high-risk-warning', '高風險警示', '過熱、高波動、跌破均線或法人賣超等固定風險規則。'],
  ['complete-data', '資料完整精選', '至少 250 個交易日，且技術、Decision 與日期一致性可用。'],
]
const round = (value, digits = 1) => value === null || !Number.isFinite(value) ? null : Number(value.toFixed(digits))
const mean = (values) => { const rows = values.filter((value) => value !== null && Number.isFinite(value)); return rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : null }
async function readJson(file, fallback = null) { try { return JSON.parse(await readFile(file, 'utf8')) } catch (error) { if (error?.code === 'ENOENT') return fallback; throw error } }
async function atomicWrite(file, value) { await mkdir(path.dirname(file), { recursive: true }); const temp = `${file}.${process.pid}.tmp`; await writeFile(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8'); try { JSON.parse(await readFile(temp, 'utf8')); await rename(temp, file) } catch (error) { await unlink(temp).catch(() => undefined); throw error } }
function tradingGap(left, right) { if (!left || !right) return null; const start = new Date(`${left < right ? left : right}T00:00:00Z`), end = new Date(`${left < right ? right : left}T00:00:00Z`); let gap = 0; for (const cursor = new Date(start); cursor < end;) { cursor.setUTCDate(cursor.getUTCDate() + 1); if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) gap += 1 } return gap }
function alignment(dates) { if (dates.some((date) => !date)) return { status: 'missing', penalty: 25, reason: '至少一個資料來源缺少交易日期' }; const sorted = [...dates].sort(); const gap = tradingGap(sorted[0], sorted.at(-1)); return gap === 0 ? { status: 'aligned', penalty: 0, reason: '資料日期一致' } : gap === 1 ? { status: 'acceptable', penalty: 8, reason: '資料相差一個交易日' } : { status: 'mismatched', penalty: 20, reason: `資料相差 ${gap} 個交易日` } }

function explain(item, aligned, medianVolatility) {
  const reasons = [], risks = []
  if (item.close !== null && item.ma20 !== null) reasons.push(`收盤價${item.close >= item.ma20 ? '高於' : '低於'} MA20 ${Math.abs((item.close / item.ma20 - 1) * 100).toFixed(1)}%`)
  if (item.ma20Slope !== null) reasons.push(`MA20 近 5 日${item.ma20Slope > 0 ? '持續上升' : '未呈上升'}（${item.ma20Slope.toFixed(2)}%）`)
  if (item.volumeRatio !== null) reasons.push(`成交量為 20 日均量 ${item.volumeRatio.toFixed(1)} 倍`)
  if (item.rsi14 !== null) reasons.push(`RSI ${item.rsi14.toFixed(0)}，${item.rsi14 >= 70 ? '位於過熱區' : item.rsi14 >= 55 ? '偏強但未過熱' : item.rsi14 <= 35 ? '位於低檔' : '處於中性區'}`)
  if (item.macdHistogram !== null) reasons.push(`MACD 柱狀體${item.macdHistogram >= 0 ? '為正且偏多' : '為負且偏弱'}`)
  if (aligned.status !== 'aligned') risks.push(`資料日期${aligned.reason}`)
  if (item.volatility20 !== null && medianVolatility !== null && item.volatility20 > medianVolatility) risks.push('波動率高於樣本中位數')
  if (item.close !== null && item.bollingerUpper !== null && item.close >= item.bollingerUpper * 0.98) risks.push('價格接近布林上軌')
  if (item.riskLevel === 'high') risks.push('固定技術規則判定為高風險')
  return { reasons, risks }
}

function evaluate(id, item, joined, medianVolatility) {
  const { institutional, decision, snapshot, aligned } = joined
  const missing = []
  const need = (...fields) => fields.every((field) => { const okay = item[field] !== null && item[field] !== undefined; if (!okay) missing.push(field); return okay })
  let matched = false
  const rules = []
  if (id === 'strong-trend') { matched = need('close', 'ma20', 'ma60', 'ma20Slope', 'rsi14', 'technicalScore') && item.close > item.ma20 && item.ma20 > item.ma60 && item.ma20Slope > 0 && item.rsi14 >= 55 && item.rsi14 <= 75 && item.technicalScore >= 70; rules.push('close > MA20', 'MA20 > MA60', 'MA20 slope > 0', 'RSI 55–75', 'Technical Score ≥ 70') }
  else if (id === 'breakout-volume') { matched = need('aboveMa20', 'volumeRatio', 'changePercent', 'macdHistogram') && item.aboveMa20 && item.volumeRatio >= 1.5 && item.changePercent > 0 && item.macdHistogram > 0; rules.push('收盤站上 MA20', '量比 ≥ 1.5', '漲幅 > 0', 'MACD 柱狀體為正') }
  else if (id === 'macd-golden-cross') { matched = need('macdCrossDays', 'aboveMa20', 'rsi14') && item.macdCrossDays <= 3 && item.aboveMa20 && item.rsi14 < 80; rules.push('近 3 日 MACD 黃金交叉', 'close ≥ MA20', 'RSI < 80') }
  else if (id === 'institution-technical') { if (!institutional) missing.push('institutionalNet'); matched = Boolean(institutional) && need('aboveMa20', 'technicalScore') && institutional.totalNetShares > 0 && item.aboveMa20 && item.technicalScore >= 60 && ['aligned', 'acceptable'].includes(aligned.status); rules.push('官方法人合計買超', 'close > MA20', 'Technical Score ≥ 60', '日期差 ≤ 1 交易日') }
  else if (id === 'oversold-rebound') { matched = need('rsi14', 'kdImproving', 'close', 'bollingerLower') && item.rsi14 <= 35 && item.kdImproving && item.close >= item.bollingerLower * 0.97; rules.push('RSI ≤ 35', 'KD 低檔改善', '未嚴重跌破布林下軌') }
  else if (id === 'low-volatility-trend') { matched = medianVolatility !== null && need('ma20Slope', 'ma60Slope', 'volatility20', 'rsi14') && item.ma20Slope > 0 && item.ma60Slope > 0 && item.volatility20 < medianVolatility && item.riskLevel !== 'high' && item.rsi14 < 70; rules.push('MA20 / MA60 向上', '波動率低於樣本中位數', '風險非高', 'RSI 未過熱') }
  else if (id === 'high-volume-momentum') { matched = need('volumeRatio', 'return20', 'aboveMa20') && item.volumeRatio >= 2 && item.return20 > 0 && item.aboveMa20; rules.push('量比 ≥ 2', '20 日報酬 > 0', 'close > MA20') }
  else if (id === 'defensive-watch') { matched = medianVolatility !== null && need('volatility20', 'aboveMa60', 'rsi14') && item.volatility20 <= medianVolatility && item.aboveMa60 && item.rsi14 >= 45 && item.rsi14 <= 65 && item.riskLevel !== 'high'; rules.push('低波動', 'close > MA60', 'RSI 45–65', '無高風險') }
  else if (id === 'high-risk-warning') { matched = (item.rsi14 !== null && item.rsi14 >= 75) || (item.atr14 !== null && item.close > 0 && item.atr14 / item.close >= 0.04) || item.aboveMa20 === false || item.aboveMa60 === false || (item.changePercent !== null && Math.abs(item.changePercent) >= 7) || (institutional?.totalNetShares ?? 0) < 0 || item.riskLevel === 'high'; rules.push('RSI 過熱', 'ATR 偏高', '跌破均線', '單日大幅波動', '法人賣超') }
  else { matched = item.historyRecordCount >= 250 && item.technicalScore !== null && decision?.score !== null && ['aligned', 'acceptable'].includes(aligned.status) && item.status !== 'stale'; if (!decision) missing.push('decisionScore'); rules.push('歷史 ≥ 250 日', '技術指標完整', '日期一致', '無 stale', 'Technical / Decision 可用') }
  const explanation = explain(item, aligned, medianVolatility)
  return { symbol: item.symbol, name: item.name, tradeDate: item.tradeDate, presetId: id, matched, rank: 0, score: item.technicalScore, confidence: Math.max(0, item.technicalConfidence - aligned.penalty - missing.length * 5), technicalScore: item.technicalScore, decisionScore: decision?.score ?? null, healthScore: null, snapshotScore: snapshot?.snapshotScore ?? null, close: item.close, changePercent: item.changePercent, rsi14: item.rsi14, macdHistogram: item.macdHistogram, volumeRatio: item.volumeRatio, aboveMa20: item.aboveMa20, aboveMa60: item.aboveMa60, k: item.k, d: item.d, return20: item.return20, return60: item.return60, volatility20: item.volatility20, historyRecordCount: item.historyRecordCount, stale: item.status === 'stale', dateAlignmentStatus: aligned.status, institutionalNet: institutional?.totalNetShares ?? null, riskLevel: item.riskLevel, reasons: explanation.reasons, risks: explanation.risks, matchedRules: rules, missingFields: [...new Set(missing)], sourceSummary: ['TWSE Official History', institutional ? 'TWSE Official Institutional' : 'Institutional Missing', decision ? 'Decision Repository' : 'Decision Missing'], warnings: [...item.warnings] }
}

async function main() {
  const technical = await readJson(path.join(DATA, 'technical-index', 'latest.json'))
  if (!technical?.records?.length) throw new Error('technical-index/latest.json 不存在或沒有可分析資料')
  const institutionalDataset = await readJson(path.join(DATA, 'twse-institutional', 'latest.json'), { records: [] })
  const institutional = new Map(institutionalDataset.records.map((row) => [row.symbol, row]))
  const decisionLatest = await readJson(path.join(DATA, 'decisions', 'latest.json'), null)
  const decisionDate = decisionLatest?.tradeDate ?? null
  const snapshotLatest = await readJson(path.join(DATA, 'stock-history', 'latest.json'), { records: [], tradeDate: null })
  const snapshots = new Map(snapshotLatest.records.map((row) => [row.symbol, row]))
  const volatilityRows = technical.records.map((row) => row.volatility20).filter((value) => value !== null).sort((a, b) => a - b)
  const medianVolatility = volatilityRows.length ? volatilityRows[Math.floor(volatilityRows.length / 2)] : null
  const results = []
  for (const item of technical.records) {
    const decision = decisionDate ? await readJson(path.join(DATA, 'decisions', decisionDate, 'stocks', `${item.symbol}.json`), null) : null
    const snapshot = snapshots.get(item.symbol) ?? null
    const institution = institutional.get(item.symbol) ?? null
    const aligned = alignment([item.tradeDate, institution?.tradeDate ?? null, snapshotLatest.tradeDate ?? null, decision?.tradeDate ?? decisionDate])
    for (const [id] of presets) results.push(evaluate(id, item, { institutional: institution, decision, snapshot, aligned }, medianVolatility))
  }
  for (const [id] of presets) {
    results.filter((row) => row.presetId === id && row.matched).sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || b.confidence - a.confidence || a.symbol.localeCompare(b.symbol)).forEach((row, index) => { row.rank = index + 1 })
  }
  const summaries = presets.map(([id, name, description]) => { const matched = results.filter((row) => row.presetId === id && row.matched); return { presetId: id, name, description, matchedCount: matched.length, averageTechnicalScore: round(mean(matched.map((row) => row.technicalScore))), averageConfidence: round(mean(matched.map((row) => row.confidence))), completenessPercent: technical.sampleCount ? Math.round(matched.filter((row) => row.missingFields.length === 0).length / technical.sampleCount * 100) : 0 } })
  const output = { schemaVersion: '1.0', formulaVersion: 'screener-v1.0', tradeDate: technical.tradeDate, generatedAt: new Date().toISOString(), technicalIndexGeneratedAt: technical.generatedAt, sampleCount: technical.sampleCount, complete250Count: technical.complete250Count, highRiskCount: summaries.find((row) => row.presetId === 'high-risk-warning')?.matchedCount ?? 0, presets: summaries, results, warnings: ['結果由固定規則產生，不構成投資建議。', technical.sampleCount < 1000 ? `目前僅分析實際覆蓋的 ${technical.sampleCount} 檔，並非全市場。` : '樣本數依當日實際技術索引覆蓋率計算。'] }
  await atomicWrite(path.join(OUT, 'latest.json'), output)
  if (output.tradeDate) await atomicWrite(path.join(OUT, 'history', `${output.tradeDate}.json`), output)
  const index = await readJson(path.join(OUT, 'index.json'), { schemaVersion: '1.0', dates: [] })
  const dates = [...new Set([...(index.dates ?? []), ...(output.tradeDate ? [output.tradeDate] : [])])].sort()
  await atomicWrite(path.join(OUT, 'index.json'), { schemaVersion: '1.0', formulaVersion: 'screener-v1.0', updatedAt: output.generatedAt, latestTradeDate: output.tradeDate, dates, sampleCount: output.sampleCount })
  console.log(`[screener] 可分析 ${output.sampleCount} 檔、250 日完整 ${output.complete250Count} 檔、高風險 ${output.highRiskCount} 檔。`)
}

main().catch((error) => { console.error(`[screener] 失敗：${error instanceof Error ? error.stack ?? error.message : String(error)}`); process.exitCode = 1 })
