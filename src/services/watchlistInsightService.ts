import { calculateStockHealth } from './stockHealthService'
import type { WatchlistAlert } from '../types/insight'
import type { Stock, WatchlistItem } from '../types/stock'

const near = (price: number, target?: number) => target !== undefined && Math.abs(price / target - 1) <= 0.03

export function generateWatchlistAlerts(items: WatchlistItem[], stocks: Stock[]): WatchlistAlert[] {
  const watched = items.map((item) => ({ item, stock: stocks.find((stock) => stock.symbol === item.symbol) })).filter((entry): entry is { item: WatchlistItem; stock: Stock } => Boolean(entry.stock))
  if (!watched.length) return []
  const ranked = [...watched].sort((a, b) => calculateStockHealth(b.stock, stocks).totalScore - calculateStockHealth(a.stock, stocks).totalScore)
  const alerts: WatchlistAlert[] = [
    { id: 'strongest', type: '最強', symbol: ranked[0].stock.symbol, title: `今日最強：${ranked[0].stock.name}`, description: `健康分數 ${calculateStockHealth(ranked[0].stock, stocks).totalScore}，漲跌幅 ${ranked[0].stock.changePercent.toFixed(2)}%。`, severity: '低' },
    { id: 'weakest', type: '最弱', symbol: ranked[ranked.length - 1].stock.symbol, title: `今日最弱：${ranked[ranked.length - 1].stock.name}`, description: `健康分數 ${calculateStockHealth(ranked[ranked.length - 1].stock, stocks).totalScore}，留意風險因子。`, severity: '中' },
  ]
  watched.forEach(({ item, stock }) => {
    const latest5 = stock.institutionalHistory.slice(-5).reduce((sum, point) => sum + point.total, 0)
    const previous5 = stock.institutionalHistory.slice(-10, -5).reduce((sum, point) => sum + point.total, 0)
    if (latest5 > 0 && previous5 <= 0) alerts.push({ id: `buy-${stock.symbol}`, type: '法人轉買', symbol: stock.symbol, title: `${stock.name}法人轉買`, description: `近 5 日三大法人轉為買超 ${latest5.toFixed(0)} 張。`, severity: '低' })
    if (latest5 < 0 && previous5 >= 0) alerts.push({ id: `sell-${stock.symbol}`, type: '法人轉賣', symbol: stock.symbol, title: `${stock.name}法人轉賣`, description: `近 5 日三大法人轉為賣超 ${Math.abs(latest5).toFixed(0)} 張。`, severity: '中' })
    if (near(stock.price, item.targetPrice)) alerts.push({ id: `target-${stock.symbol}`, type: '接近觀察價', symbol: stock.symbol, title: `${stock.name}接近觀察價`, description: `現價與觀察價差距低於 3%。`, severity: '低' })
    if (near(stock.price, item.stopLossPrice)) alerts.push({ id: `loss-${stock.symbol}`, type: '接近停損', symbol: stock.symbol, title: `${stock.name}接近停損參考價`, description: '請依自身風險承受度重新檢視部位。', severity: '高' })
    if (near(stock.price, item.takeProfitPrice)) alerts.push({ id: `profit-${stock.symbol}`, type: '接近停利', symbol: stock.symbol, title: `${stock.name}接近停利參考價`, description: '可觀察量價與壓力區表現。', severity: '中' })
    if (calculateStockHealth(stock, stocks).risks.some((risk) => risk.severity === '高')) alerts.push({ id: `risk-${stock.symbol}`, type: '高風險', symbol: stock.symbol, title: `${stock.name}出現高風險訊號`, description: '健檢規則偵測到高嚴重程度風險，建議查看完整健檢。', severity: '高' })
  })
  return alerts
}
