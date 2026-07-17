import type { TechnicalIndicatorSeries, TechnicalSignal } from '../../types/technicalIndicator'

const source = 'GULI Derived from TWSE Official History' as const
const formulaVersion = 'technical-signal-v1.0' as const

export function generateTechnicalSignals(series: TechnicalIndicatorSeries): TechnicalSignal[] {
  const signals: TechnicalSignal[] = []
  const index = series.prices.length - 1
  if (index < 0) return signals
  const previous = index - 1
  const date = series.prices[index].tradeDate
  const close = series.prices[index].close
  const previousClose = series.prices[previous]?.close ?? null
  const add = (signal: Omit<TechnicalSignal, 'tradeDate' | 'source' | 'formulaVersion'>) => signals.push({ ...signal, tradeDate: date, source, formulaVersion })
  const crossedUp = (a: number | null | undefined, b: number | null | undefined, previousA: number | null | undefined, previousB: number | null | undefined) => a !== null && a !== undefined && b !== null && b !== undefined && previousA !== null && previousA !== undefined && previousB !== null && previousB !== undefined && a > b && previousA <= previousB
  const crossedDown = (a: number | null | undefined, b: number | null | undefined, previousA: number | null | undefined, previousB: number | null | undefined) => a !== null && a !== undefined && b !== null && b !== undefined && previousA !== null && previousA !== undefined && previousB !== null && previousB !== undefined && a < b && previousA >= previousB

  const ma20 = series.ma20[index]?.value; const previousMa20 = series.ma20[previous]?.value
  if (crossedUp(close, ma20, previousClose, previousMa20)) add({ id: 'close-cross-ma20-up', name: '收盤站上 MA20', direction: 'positive', severity: 'medium', explanation: '收盤價由下往上穿越 20 日均線。', evidence: { close, ma20 } })
  if (crossedDown(close, ma20, previousClose, previousMa20)) add({ id: 'close-cross-ma20-down', name: '收盤跌破 MA20', direction: 'negative', severity: 'high', explanation: '收盤價由上往下跌破 20 日均線。', evidence: { close, ma20 } })

  const ma5 = series.ma5[index]?.value; const previousMa5 = series.ma5[previous]?.value
  if (crossedUp(ma5, ma20, previousMa5, previousMa20)) add({ id: 'ma5-cross-ma20-up', name: '短均線黃金交叉', direction: 'positive', severity: 'medium', explanation: 'MA5 由下往上穿越 MA20。', evidence: { ma5, ma20 } })
  if (crossedDown(ma5, ma20, previousMa5, previousMa20)) add({ id: 'ma5-cross-ma20-down', name: '短均線死亡交叉', direction: 'negative', severity: 'medium', explanation: 'MA5 由上往下跌破 MA20。', evidence: { ma5, ma20 } })

  const ma60 = series.ma60[index]?.value; const previousMa60 = series.ma60[previous]?.value
  if (crossedUp(ma20, ma60, previousMa20, previousMa60)) add({ id: 'ma20-cross-ma60-up', name: '中期黃金交叉', direction: 'positive', severity: 'high', explanation: 'MA20 由下往上穿越 MA60。', evidence: { ma20, ma60 } })
  if (crossedDown(ma20, ma60, previousMa20, previousMa60)) add({ id: 'ma20-cross-ma60-down', name: '中期死亡交叉', direction: 'negative', severity: 'high', explanation: 'MA20 由上往下跌破 MA60。', evidence: { ma20, ma60 } })

  const macd = series.macd[index]; const previousMacd = series.macd[previous]
  if (crossedUp(macd?.macd, macd?.signal, previousMacd?.macd, previousMacd?.signal)) add({ id: 'macd-golden-cross', name: 'MACD 黃金交叉', direction: 'positive', severity: 'medium', explanation: 'MACD 線由下往上穿越訊號線。', evidence: { macd: macd.macd, signal: macd.signal } })
  if (crossedDown(macd?.macd, macd?.signal, previousMacd?.macd, previousMacd?.signal)) add({ id: 'macd-death-cross', name: 'MACD 死亡交叉', direction: 'negative', severity: 'medium', explanation: 'MACD 線由上往下跌破訊號線。', evidence: { macd: macd.macd, signal: macd.signal } })

  const rsi = series.rsi14[index]?.value
  if (rsi !== null && rsi !== undefined) {
    const rsiState = rsi >= 70 ? ['RSI 過熱', 'warning', 'high'] : rsi >= 55 ? ['RSI 偏強', 'positive', 'info'] : rsi <= 30 ? ['RSI 超賣', 'warning', 'high'] : rsi < 45 ? ['RSI 偏弱', 'negative', 'info'] : ['RSI 中性', 'neutral', 'info']
    add({ id: `rsi-${rsiState[0]}`, name: rsiState[0], direction: rsiState[1] as TechnicalSignal['direction'], severity: rsiState[2] as TechnicalSignal['severity'], explanation: `RSI14 為 ${rsi.toFixed(2)}。`, evidence: { rsi } })
  }

  const kd = series.stochastic[index]; const previousKd = series.stochastic[previous]
  if (crossedUp(kd?.k, kd?.d, previousKd?.k, previousKd?.d)) add({ id: 'kd-golden-cross', name: 'KD 黃金交叉', direction: 'positive', severity: 'info', explanation: 'K 值由下往上穿越 D 值。', evidence: { k: kd.k, d: kd.d } })
  if (crossedDown(kd?.k, kd?.d, previousKd?.k, previousKd?.d)) add({ id: 'kd-death-cross', name: 'KD 死亡交叉', direction: 'negative', severity: 'info', explanation: 'K 值由上往下跌破 D 值。', evidence: { k: kd.k, d: kd.d } })

  const band = series.bollinger[index]
  if (close !== null && band?.upper !== null && band?.upper !== undefined && close > band.upper) add({ id: 'bollinger-upper-break', name: '突破布林上軌', direction: 'warning', severity: 'medium', explanation: '收盤價高於 20 日布林上軌，短線波動可能擴大。', evidence: { close, upper: band.upper } })
  if (close !== null && band?.lower !== null && band?.lower !== undefined && close < band.lower) add({ id: 'bollinger-lower-break', name: '跌破布林下軌', direction: 'warning', severity: 'high', explanation: '收盤價低於 20 日布林下軌。', evidence: { close, lower: band.lower } })

  const volumeRatio = series.volumeRatio20[index]?.value
  if (volumeRatio !== null && volumeRatio !== undefined && volumeRatio > 1.5) add({ id: 'volume-expansion', name: '成交量放大', direction: 'neutral', severity: 'medium', explanation: '成交量大於 20 日均量的 1.5 倍。', evidence: { volumeRatio } })
  const atr = series.atr14[index]?.value
  if (atr !== null && atr !== undefined && close !== null && close > 0 && atr / close >= 0.04) add({ id: 'atr-high-volatility', name: 'ATR 高波動', direction: 'warning', severity: 'high', explanation: 'ATR14 已達收盤價 4% 以上，價格波動偏高。', evidence: { atr, close, atrPercent: atr / close * 100 } })
  return signals
}

