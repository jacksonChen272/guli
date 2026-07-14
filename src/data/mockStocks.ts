import type { Stock } from '../types/stock'

const formatDate = (date: Date) => date.toISOString().slice(0, 10)
const buildTradingDates = (count: number) => {
  const dates: string[] = []
  const cursor = new Date('2026-07-10T00:00:00Z')
  while (dates.length < count) {
    const day = cursor.getUTCDay()
    if (day !== 0 && day !== 6) dates.unshift(formatDate(cursor))
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return dates
}

export const tradingDates = buildTradingDates(60)

type StockSeed = [string, string, string, number, number]

const stockSeeds: StockSeed[] = [
  ['2330', '台積電', '半導體', 1085, 2.36], ['2313', '華通', 'PCB', 82.6, 4.03],
  ['3006', '晶豪科', '半導體', 91.2, 3.17], ['2382', '廣達', 'AI 伺服器', 314.5, 2.11],
  ['3231', '緯創', 'AI 伺服器', 126.5, 1.61], ['3017', '奇鋐', '散熱', 688, 5.2],
  ['3661', '世芯-KY', '半導體', 2875, 1.77], ['2603', '長榮', '航運', 216, -1.37],
  ['2881', '富邦金', '金融', 93.5, 1.08], ['2303', '聯電', '半導體', 53.4, -0.56],
  ['2454', '聯發科', '半導體', 1490, 2.41], ['2376', '技嘉', 'AI 伺服器', 298.5, 3.29],
  ['6669', '緯穎', 'AI 伺服器', 2485, 4.19], ['2383', '台光電', 'PCB', 782, 3.71],
  ['3037', '欣興', 'PCB', 176.5, 2.32], ['2327', '國巨', '被動元件', 612, -0.81],
  ['2345', '智邦', '網通', 842, 4.47], ['2615', '萬海', '航運', 92.8, -2.11],
  ['2882', '國泰金', '金融', 72.4, 0.84], ['2891', '中信金', '金融', 43.1, 1.29],
  ['2308', '台達電', '電源管理', 442, 1.96], ['2357', '華碩', '電腦週邊', 684, 0.74],
  ['2379', '瑞昱', '半導體', 574, -0.69], ['3044', '健鼎', 'PCB', 231, 2.67],
  ['2356', '英業達', 'AI 伺服器', 51.8, 1.17], ['3529', '力旺', '半導體', 2610, -1.51],
  ['5871', '中租-KY', '金融', 142.5, -0.35], ['1519', '華城', '重電', 856, 3.76],
  ['9958', '世紀鋼', '綠能', 218.5, -1.13], ['6446', '藥華藥', '生技', 689, 2.53],
]

const otcSymbols = new Set(['3006', '3529', '6446'])
const round = (value: number, digits = 1) => Number(value.toFixed(digits))

export const mockStocks: Stock[] = stockSeeds.map(([symbol, name, industry, price, changePercent], stockIndex) => {
  const direction = changePercent >= 0 ? 1 : -1
  const priceHistory = tradingDates.map((date, dayIndex) => {
    const age = dayIndex - (tradingDates.length - 1)
    const wave = Math.sin((dayIndex + stockIndex) * 0.61) * (0.008 + (stockIndex % 4) * 0.002)
    const drift = age * (changePercent / 2800 + ((stockIndex % 5) - 2) / 13000)
    const value = round(price * (1 + drift + wave), price < 100 ? 2 : 1)
    const baseVolume = 4200 + stockIndex * 720
    const volume = Math.round(baseVolume * (0.76 + Math.abs(Math.sin(dayIndex * 0.53 + stockIndex)) * 0.55 + Math.max(changePercent, 0) / 14))
    return { date, value, volume }
  })
  priceHistory[priceHistory.length - 1].value = price

  const institutionalHistory = tradingDates.map((date, dayIndex) => {
    const cycle = Math.sin(dayIndex * 0.58 + stockIndex)
    const trend = changePercent * (0.55 + dayIndex / 120)
    const foreign = round((trend * 620 + cycle * 460 + (stockIndex % 4 - 1) * 90) / 10)
    const trust = round((trend * 230 + Math.cos(dayIndex * 0.44 + stockIndex) * 170) / 10)
    const dealer = round((trend * 95 - Math.sin(dayIndex * 0.71) * 110) / 10)
    return { date, foreign, trust, dealer, total: round(foreign + trust + dealer) }
  })
  const latestFlow = institutionalHistory[institutionalHistory.length - 1]
  const institutions = { foreign: latestFlow.foreign, trust: latestFlow.trust, dealer: latestFlow.dealer, total: latestFlow.total }
  const capitalFlow = round(institutions.total / 100)
  const momentum = round(changePercent * 1.35 + ((stockIndex % 7) - 3) * 0.42)
  const returns = priceHistory.slice(-20).map((point, index, all) => index ? (point.value / all[index - 1].value - 1) * 100 : 0)
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length
  const volatility = round(Math.sqrt(returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length), 2)

  return {
    symbol, name, industry, price, changePercent,
    board: otcSymbols.has(symbol) ? 'otc' : 'listed',
    change: round(price * changePercent / 100, 2),
    volume: priceHistory[priceHistory.length - 1].volume ?? 0,
    institutions,
    institutionalHistory,
    capitalFlow,
    momentum,
    cumulative20d: round(institutionalHistory.slice(-20).reduce((sum, item) => sum + item.total, 0) / 100),
    rsi: Math.max(18, Math.min(88, round(50 + changePercent * 5 + momentum * 1.7))),
    volatility,
    marginChange: round(((stockIndex % 9) - 4) * 0.72 + changePercent * 0.18, 2),
    industryStrength: Math.max(15, Math.min(95, round(55 + changePercent * 5.2 + direction * (stockIndex % 6)))),
    priceHistory,
  }
})

export const getStockBySymbol = (symbol: string) => mockStocks.find((stock) => stock.symbol === symbol)
