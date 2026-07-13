import type { Stock } from '../types/stock'

export const tradingDates = [
  '2026-06-15', '2026-06-16', '2026-06-17', '2026-06-18', '2026-06-19',
  '2026-06-22', '2026-06-23', '2026-06-24', '2026-06-25', '2026-06-26',
  '2026-06-29', '2026-06-30', '2026-07-01', '2026-07-02', '2026-07-03',
  '2026-07-06', '2026-07-07', '2026-07-08', '2026-07-09', '2026-07-10',
]

type StockSeed = [string, string, string, number, number, number]

const stockSeeds: StockSeed[] = [
  ['2330', '台積電', '半導體', 1085, 2.36, 96],
  ['2313', '華通', 'PCB', 82.6, 4.03, 87],
  ['3006', '晶豪科', '半導體', 91.2, 3.17, 76],
  ['2382', '廣達', 'AI 伺服器', 314.5, 2.11, 91],
  ['3231', '緯創', 'AI 伺服器', 126.5, 1.61, 83],
  ['3017', '奇鋐', '散熱', 688, 5.20, 94],
  ['3661', '世芯-KY', '半導體', 2875, 1.77, 79],
  ['2603', '長榮', '航運', 216, -1.37, 53],
  ['2881', '富邦金', '金融', 93.5, 1.08, 74],
  ['2303', '聯電', '半導體', 53.4, -0.56, 61],
  ['2454', '聯發科', '半導體', 1490, 2.41, 89],
  ['2376', '技嘉', 'AI 伺服器', 298.5, 3.29, 86],
  ['6669', '緯穎', 'AI 伺服器', 2485, 4.19, 92],
  ['2383', '台光電', 'PCB', 782, 3.71, 90],
  ['3037', '欣興', 'PCB', 176.5, 2.32, 82],
  ['2327', '國巨', '被動元件', 612, -0.81, 58],
  ['2345', '智邦', '網通', 842, 4.47, 93],
  ['2615', '萬海', '航運', 92.8, -2.11, 45],
  ['2882', '國泰金', '金融', 72.4, 0.84, 70],
  ['2891', '中信金', '金融', 43.1, 1.29, 77],
  ['2308', '台達電', '電源管理', 442, 1.96, 85],
  ['2357', '華碩', '電腦週邊', 684, 0.74, 69],
  ['2379', '瑞昱', '半導體', 574, -0.69, 62],
  ['3044', '健鼎', 'PCB', 231, 2.67, 80],
  ['2356', '英業達', 'AI 伺服器', 51.8, 1.17, 68],
  ['3529', '力旺', '半導體', 2610, -1.51, 57],
  ['5871', '中租-KY', '金融', 142.5, -0.35, 55],
  ['1519', '華城', '重電', 856, 3.76, 88],
  ['9958', '世紀鋼', '綠能', 218.5, -1.13, 51],
  ['6446', '藥華藥', '生技醫療', 689, 2.53, 81],
]

const otcSymbols = new Set(['3006', '3529', '6446'])

export const mockStocks: Stock[] = stockSeeds.map(([symbol, name, industry, price, changePercent, healthScore], stockIndex) => {
  const direction = changePercent >= 0 ? 1 : -1
  const foreign = Math.round((changePercent * 920 + (stockIndex % 5 - 2) * 180) * 10) / 10
  const trust = Math.round((changePercent * 350 + (stockIndex % 4 - 1) * 90) * 10) / 10
  const dealer = Math.round((changePercent * 140 - (stockIndex % 3) * 55) * 10) / 10
  const capitalFlow = Math.round((foreign + trust + dealer) / 100) / 10
  const momentum = Math.round((changePercent * 1.35 + ((stockIndex % 7) - 3) * .42) * 10) / 10
  const priceHistory = tradingDates.map((date, dayIndex) => {
    const wave = Math.sin((dayIndex + stockIndex) * .72) * .012
    const drift = (dayIndex - 19) * (changePercent / 1000)
    return {
      date,
      value: Math.round(price * (1 + drift + wave) * 10) / 10,
      volume: Math.round((5200 + stockIndex * 830 + dayIndex * 127 + Math.abs(Math.sin(dayIndex)) * 2500)),
    }
  })
  priceHistory[19].value = price
  return {
    symbol, name, industry, price, changePercent, healthScore,
    board: otcSymbols.has(symbol) ? 'otc' : 'listed',
    change: Math.round(price * changePercent) / 100,
    volume: priceHistory[19].volume ?? 0,
    institutions: { foreign, trust, dealer, total: Math.round((foreign + trust + dealer) * 10) / 10 },
    capitalFlow,
    momentum,
    cumulative20d: Math.round((capitalFlow * (8 + (stockIndex % 9)) + direction * 1.8) * 10) / 10,
    priceHistory,
  }
})

export const getStockBySymbol = (symbol: string) => mockStocks.find((stock) => stock.symbol === symbol)
