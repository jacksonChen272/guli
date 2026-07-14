import type { WatchlistItem } from '../types/stock'
import { marketRepository } from './dataRepository'
import { generateMarketHeadline } from './marketInsightService'
import { calculateStockHealth } from './stockHealthService'
import { generateWatchlistAlerts } from './watchlistInsightService'

export const gubaoQuestions = ['今天市場偏多還是偏空？', '哪個產業最強？', '哪個產業最弱？', '我的自選股有哪些風險？', '2330 現在健康分數多少？', '哪些股票法人正在轉買？'] as const
export type GubaoQuestion = typeof gubaoQuestions[number]

export function answerGubaoQuestion(question: GubaoQuestion, watchlist: WatchlistItem[]): string {
  const mockIndustries = marketRepository.getIndustries(); const mockStocks = marketRepository.getStocks(); const temperature = marketRepository.getOverview().temperature.score
  const ranked = [...mockIndustries].sort((a, b) => b.changePercent - a.changePercent)
  if (question === '今天市場偏多還是偏空？') { const headline = generateMarketHeadline(); return `目前判定為「${headline.marketState}」，市場溫度 ${temperature} 分。${headline.headline}信心程度 ${headline.confidence}%。` }
  if (question === '哪個產業最強？') return `${ranked[0].name}目前最強，產業平均漲跌幅 ${ranked[0].changePercent.toFixed(2)}%，資金流向 ${ranked[0].capitalFlow.toFixed(1)}。`
  if (question === '哪個產業最弱？') { const item = ranked[ranked.length - 1]; return `${item.name}目前相對最弱，產業平均漲跌幅 ${item.changePercent.toFixed(2)}%，動能 ${item.momentum.toFixed(1)}，需留意資金是否持續流出。` }
  if (question === '我的自選股有哪些風險？') { const alerts = generateWatchlistAlerts(watchlist, mockStocks).filter((alert) => alert.severity !== '低'); return alerts.length ? alerts.slice(0, 3).map((alert) => `${alert.title}：${alert.description}`).join('；') : '目前自選股沒有觸發中高風險規則，但仍應持續觀察法人與價格變化。' }
  if (question === '2330 現在健康分數多少？') { const stock = marketRepository.getStock('2330'); if (!stock) return '目前找不到 2330 的資料。'; const health = calculateStockHealth(stock, mockStocks); return `台積電目前健康分數 ${health.totalScore} 分，分級為「${health.grade}」。${health.summary}本內容僅供資訊參考，不構成投資建議。` }
  const turning = mockStocks.filter((stock) => stock.institutionalHistory.slice(-5).reduce((sum, item) => sum + item.total, 0) > 0 && stock.institutionalHistory.slice(-10, -5).reduce((sum, item) => sum + item.total, 0) <= 0).slice(0, 5)
  return turning.length ? `依近兩個 5 日區間比較，法人正在轉買：${turning.map((stock) => `${stock.symbol} ${stock.name}`).join('、')}。` : '目前沒有股票同時符合「前 5 日賣超、近 5 日轉買超」規則。'
}
