import type { MarketEvent } from '../types/market'

export const mockInsightEvents: MarketEvent[] = [
  { id: 'evt-1', time: '09:10', category: '國際市場', title: '美國科技股走勢提供電子族群正向參考', source: 'GULI 事件資料' },
  { id: 'evt-2', time: '10:30', category: '產業動態', title: 'AI 伺服器供應鏈成交比重持續提升', source: 'GULI 事件資料' },
  { id: 'evt-3', time: '11:20', category: '法人動向', title: '投信買盤集中於 PCB 與散熱族群', source: 'GULI 事件資料' },
  { id: 'evt-4', time: '13:05', category: '市場風險', title: '航運高檔量能降溫，留意短線震盪', source: 'GULI 事件資料' },
]

export const insightUpdatedAt = '2026/07/10 13:35'
