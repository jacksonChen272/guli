import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import type { TechnicalIndicatorSeries, TechnicalSummaryItem } from '../../types/technicalIndicator'
import { calculateATR } from './ATRService'
import { calculateBollinger } from './BollingerService'
import { calculateEMA } from './EMAService'
import { calculateMACD } from './MACDService'
import { calculateRSI } from './RSIService'
import { calculateSMA } from './SMAService'
import { calculateStochastic } from './StochasticService'
import { closes, rollingValues, round, toIndicatorPoints, volumes } from './indicatorUtils'

const latest = <T>(values: T[]) => values.at(-1)
const display = (value: number | null | undefined, suffix = '') => value === null || value === undefined ? '尚無法計算' : `${value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}${suffix}`

export function calculateTechnicalIndicators(prices: OfficialStockHistoryPrice[]): TechnicalIndicatorSeries {
  const averageVolume20Values = rollingValues(volumes(prices), 20, (window) => window.reduce((sum, value) => sum + value, 0) / 20)
  const volumeRatioValues = prices.map((point, index) => point.volume === null || averageVolume20Values[index] === null || averageVolume20Values[index] === 0 ? null : round(point.volume / (averageVolume20Values[index] as number)))
  const sourceCloses = closes(prices)
  const returns = (period: number) => sourceCloses.map((close, index) => index < period || close === null || sourceCloses[index - period] === null || sourceCloses[index - period] === 0 ? null : round((close / (sourceCloses[index - period] as number) - 1) * 100))
  const volatilityValues = sourceCloses.map((_, index) => {
    if (index < 20) return null
    const dailyReturns = sourceCloses.slice(index - 20, index + 1).slice(1).map((close, offset) => close === null || sourceCloses[index - 20 + offset] === null || sourceCloses[index - 20 + offset] === 0 ? null : close / (sourceCloses[index - 20 + offset] as number) - 1)
    if (dailyReturns.some((value) => value === null)) return null
    const values = dailyReturns as number[]
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length
    return round(Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length) * Math.sqrt(252) * 100)
  })
  return {
    source: 'GULI Derived from TWSE Official History', formulaVersion: 'technical-v1.0', sampleSize: prices.length,
    firstTradeDate: prices[0]?.tradeDate ?? null, lastTradeDate: prices.at(-1)?.tradeDate ?? null, prices,
    ma5: calculateSMA(prices, 5), ma10: calculateSMA(prices, 10), ma20: calculateSMA(prices, 20), ma60: calculateSMA(prices, 60), ma120: calculateSMA(prices, 120),
    ema12: calculateEMA(prices, 12), ema26: calculateEMA(prices, 26), rsi14: calculateRSI(prices, 14), stochastic: calculateStochastic(prices),
    macd: calculateMACD(prices), bollinger: calculateBollinger(prices), atr14: calculateATR(prices, 14),
    averageVolume20: toIndicatorPoints(prices, averageVolume20Values, 20), volumeRatio20: toIndicatorPoints(prices, volumeRatioValues, 20),
    return20: toIndicatorPoints(prices, returns(20), 20), return60: toIndicatorPoints(prices, returns(60), 60), volatility20: toIndicatorPoints(prices, volatilityValues, 20),
  }
}

export function createTechnicalSummary(series: TechnicalIndicatorSeries): TechnicalSummaryItem[] {
  const date = series.lastTradeDate
  const close = latest(series.prices)?.close
  const ma20 = latest(series.ma20)?.value
  const rsi = latest(series.rsi14)?.value
  const kd = latest(series.stochastic)
  const macd = latest(series.macd)
  const volumeRatio = latest(series.volumeRatio20)?.value
  const volatility = latest(series.volatility20)?.value
  return [
    { id: 'trend', label: '趨勢', value: display(ma20), status: close === null || close === undefined || ma20 === null || ma20 === undefined ? '資料不足' : close >= ma20 ? '站上 MA20' : '跌破 MA20', tradeDate: date, period: 'MA20', source: 'Derived', explanation: '比較最新收盤價與 20 日移動平均線。' },
    { id: 'rsi', label: 'RSI', value: display(rsi), status: rsi === null || rsi === undefined ? '資料不足' : rsi >= 70 ? '過熱' : rsi <= 30 ? '超賣' : rsi >= 50 ? '偏強' : '偏弱', tradeDate: date, period: 'RSI14', source: 'Derived', explanation: 'RSI 衡量最近 14 期漲跌動能，70 以上為過熱、30 以下為超賣。' },
    { id: 'kd', label: 'KD', value: kd?.k === null || kd?.d === null || !kd ? '尚無法計算' : `K ${display(kd.k)} / D ${display(kd.d)}`, status: kd?.k === null || kd?.d === null || !kd ? '資料不足' : kd.k >= kd.d ? 'K 高於 D' : 'K 低於 D', tradeDate: date, period: 'KD 9,3,3', source: 'Derived', explanation: 'KD 以 9 日區間位置計算，K 與 D 的相對位置反映短線動能。' },
    { id: 'macd', label: 'MACD', value: display(macd?.histogram), status: macd?.histogram === null || macd?.histogram === undefined ? '資料不足' : macd.histogram >= 0 ? '多方柱體' : '空方柱體', tradeDate: date, period: 'MACD 12,26,9', source: 'Derived', explanation: 'MACD 柱體為 DIF 與訊號線之差。' },
    { id: 'volume', label: '成交量', value: display(volumeRatio, 'x'), status: volumeRatio === null || volumeRatio === undefined ? '資料不足' : volumeRatio >= 1.5 ? '量能放大' : volumeRatio < 0.7 ? '量能萎縮' : '量能正常', tradeDate: date, period: '20 日均量比', source: 'Derived', explanation: '最新成交量除以 20 日平均成交量。' },
    { id: 'volatility', label: '波動率', value: display(volatility, '%'), status: volatility === null || volatility === undefined ? '資料不足' : volatility >= 45 ? '高波動' : volatility >= 25 ? '中波動' : '低波動', tradeDate: date, period: '20 日年化', source: 'Derived', explanation: '以近 20 日報酬標準差年化，不代表未來波動。' },
  ]
}

