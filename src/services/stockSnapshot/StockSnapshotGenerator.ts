import { validateStockDailyRecord } from '../stockData/StockDailyValidator'
import type { OfficialStockDailyDataset, OfficialStockDailyRecord } from '../../types/officialStockData'
import type { StockSnapshotDataset, StockSnapshotItem, StockSnapshotRisk, StockSnapshotSource, StockSnapshotStatus } from '../../types/stockSnapshot'

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value * 10) / 10))
const round = (value: number) => Math.round(value * 100) / 100
const weighted = (parts: Array<[number | null, number]>) => { const valid = parts.filter((part): part is [number, number] => part[0] !== null && Number.isFinite(part[0])); const weight = valid.reduce((sum, part) => sum + part[1], 0); return weight ? clamp(valid.reduce((sum, part) => sum + part[0] * part[1], 0) / weight) : null }
const percentileMap = (records: OfficialStockDailyRecord[], field: 'tradeValue' | 'tradeVolume' | 'transactionCount') => { const values = records.map((record) => record[field]).filter((value): value is number => value !== null && value >= 0).sort((a,b)=>a-b); return (value: number | null) => { if (value === null || !values.length) return null; if (values.length === 1) return 50; let low = 0; while (low < values.length && values[low] < value) low++; let high = low; while (high < values.length && values[high] === value) high++; return clamp(((low + high - 1) / 2) / (values.length - 1) * 100) } }
const risk = (code: StockSnapshotRisk['code'], severity: StockSnapshotRisk['severity'], title: string, reason: string, source: StockSnapshotRisk['source'] = 'derived'): StockSnapshotRisk => ({ code, severity, title, reason, source })
const statusFor = (score: number | null): StockSnapshotStatus => score === null ? '資料不足' : score >= 81 ? '強勢' : score >= 66 ? '偏強' : score >= 51 ? '中性' : score >= 36 ? '偏弱' : '弱勢'
export function calculateChangePercent(record: Pick<OfficialStockDailyRecord,'close'|'change'>) { if (record.close === null || record.change === null) return null; const previous = record.close - record.change; return previous > 0 ? round(record.change / previous * 100) : null }
export class StockSnapshotGenerator {
  generate(dataset: OfficialStockDailyDataset): StockSnapshotDataset {
    const officialStocks = dataset.records.filter((record) => record.instrumentType === 'stock' && record.status !== 'invalid' && validateStockDailyRecord(record).valid)
    const valuePercentile = percentileMap(officialStocks, 'tradeValue'); const volumePercentile = percentileMap(officialStocks, 'tradeVolume'); const transactionPercentile = percentileMap(officialStocks, 'transactionCount')
    const records = officialStocks.map((record) => this.toItem(record, valuePercentile, volumePercentile, transactionPercentile))
    const sources: StockSnapshotSource[] = [{ type:'official', name:'臺灣證券交易所每日收盤行情' }, { type:'derived', name:'GULI Stock Snapshot 規則引擎' }]
    return { schemaVersion:'1.0', market:'TWSE', tradeDate:dataset.tradeDate, generatedAt:new Date().toISOString(), records, sources, warnings:[...dataset.warnings] }
  }
  private toItem(record: OfficialStockDailyRecord, valuePct:(v:number|null)=>number|null, volumePct:(v:number|null)=>number|null, transactionPct:(v:number|null)=>number|null): StockSnapshotItem {
    const changePercent = calculateChangePercent(record)
    const ohlcComplete = [record.open,record.high,record.low,record.close].every((value)=>value!==null)
    const dailyRangePercent = record.high !== null && record.low !== null && record.low > 0 ? round((record.high-record.low)/record.low*100) : null
    const pricePosition = record.close !== null && record.high !== null && record.low !== null ? record.high === record.low ? 50 : clamp((record.close-record.low)/(record.high-record.low)*100) : null
    const changeScore = changePercent === null ? null : clamp(50 + changePercent * 5)
    const openScore = record.open === null || record.close === null ? null : record.close > record.open ? 70 : record.close < record.open ? 30 : 50
    const priceStrengthScore = weighted([[changeScore,45],[pricePosition,35],[openScore,20]])
    const liquidityScore = weighted([[valuePct(record.tradeValue),45],[volumePct(record.tradeVolume),35],[transactionPct(record.transactionCount),20]])
    const pe = record.peRatio
    const valuationRiskScore = pe === null ? null : pe <= 0 ? 70 : pe <= 15 ? 20 : pe <= 25 ? 35 : pe <= 40 ? 55 : pe <= 60 ? 75 : 90
    const valuationSafety = valuationRiskScore === null ? null : 100-valuationRiskScore
    const snapshotScore = priceStrengthScore === null || liquidityScore === null ? null : weighted([[priceStrengthScore,45],[liquidityScore,35],[valuationSafety,20]])
    const risks: StockSnapshotRisk[]=[]; const warnings=[...record.warnings]
    if (changePercent !== null && changePercent >= 7) risks.push(risk('extreme_daily_gain','high','單日漲幅偏大',`單日漲幅 ${changePercent.toFixed(2)}% 達 7% 門檻。`))
    if (changePercent !== null && changePercent <= -7) risks.push(risk('extreme_daily_loss','high','單日跌幅偏大',`單日跌幅 ${changePercent.toFixed(2)}% 達 -7% 門檻。`))
    if (dailyRangePercent !== null && dailyRangePercent >= 8) risks.push(risk('wide_daily_range','medium','單日振幅偏大',`單日振幅 ${dailyRangePercent.toFixed(2)}% 達 8% 門檻。`))
    if (pricePosition !== null && pricePosition <= 20) risks.push(risk('close_near_low','medium','收盤接近低點',`收盤位於當日區間第 ${pricePosition.toFixed(1)} 百分位。`))
    if (liquidityScore !== null && liquidityScore <= 15) risks.push(risk('low_liquidity','medium','流動性偏低',`當日流動性分數 ${liquidityScore.toFixed(1)} 不高於 15。`))
    if (pe !== null && pe >= 60) risks.push(risk('unusually_high_pe','medium','本益比偏高',`官方本益比 ${pe.toFixed(2)} 達一般性 60 倍門檻；未做產業比較。`,'official'))
    if (!ohlcComplete) { risks.push(risk('missing_ohlc','high','價量欄位不完整','官方開高低收至少一項缺漏。','official')); warnings.push('OHLC 資料不完整，部分衍生分數可能為空值。') }
    if (pe === null) { risks.push(risk('missing_pe','low','本益比未提供','官方資料未提供本益比，估值風險不計分。','official')); warnings.push('本益比缺值，snapshotScore 以可用權重重新正規化。') }
    if (record.status === 'partial') risks.push(risk('partial_official_data','medium','官方資料為部分狀態','來源資料標示為 partial。','official'))
    const tags=[snapshotScore!==null?statusFor(snapshotScore):'資料不足', changePercent!==null&&changePercent>0?'上漲':changePercent!==null&&changePercent<0?'下跌':'平盤']
    return { symbol:record.symbol,name:record.name,tradeDate:record.tradeDate,market:'TWSE',instrumentType:'stock',quote:{open:record.open,high:record.high,low:record.low,close:record.close,change:record.change,changePercent,tradeVolume:record.tradeVolume,transactionCount:record.transactionCount,tradeValue:record.tradeValue,peRatio:pe},dailyRangePercent,turnoverAverageValue:record.transactionCount&&record.tradeValue!==null?round(record.tradeValue/record.transactionCount):null,pricePosition,liquidityScore,priceStrengthScore,valuationRiskScore,snapshotScore,status:statusFor(snapshotScore),risks,tags,sources:[{type:'official',name:'TWSE',field:'quote'},{type:'derived',name:'GULI deterministic rules',field:'scores'}],warnings:[...new Set(warnings)] }
  }
}
