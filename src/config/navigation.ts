import type { LucideIcon } from 'lucide-react'
import { Bot, Building2, ChartCandlestick, CircleDollarSign, Crosshair, Database, Gauge, History, Radar, Settings, Star } from 'lucide-react'
export type PageConfig = { path: string; label: string; title: string; description: string; icon: LucideIcon; eyebrow: string }
export const dashboardPage: PageConfig = { path: '/', label: '市場總覽', title: '台股市場總覽', description: '整合市場脈動、資金輪動與可解釋的規則洞察。', icon: Gauge, eyebrow: 'Dashboard' }
export const historyPage: PageConfig = { path: '/history', label: '市場歷史', title: '市場歷史', description: '依實際存在的 Market Snapshot 追蹤市場狀態。', icon: History, eyebrow: 'Market History' }
export const industriesPage: PageConfig = { path: '/industries', label: '產業分析', title: '產業分析', description: '以固定規則追蹤產業強弱、資金、動能與風險。', icon: Building2, eyebrow: 'Industry Snapshot' }
export const stockDataStatusPage: PageConfig = { path: '/data-status/stocks', label: '個股資料狀態', title: '上市個股資料狀態', description: '檢視 TWSE 上市股票靜態資料集、品質與更新狀態。', icon: Database, eyebrow: 'TWSE Stock Data' }
export const routePages: PageConfig[] = [
  historyPage, industriesPage,
  { path: '/capital-flow', label: '資金輪動', title: '資金輪動', description: '觀察產業與個股的資金流向與資金動能。', icon: CircleDollarSign, eyebrow: 'Capital Flow' },
  { path: '/market-focus', label: '市場焦點', title: '市場焦點', description: '彙整今日市場訊號、事件與風險。', icon: Radar, eyebrow: 'Market Focus' },
  { path: '/stock-analysis', label: '個股分析', title: '個股分析', description: '搜尋股票代號或名稱進行規則型健檢。', icon: ChartCandlestick, eyebrow: 'Stock Analysis' },
  { path: '/swing-strategy', label: '波段策略', title: '波段策略', description: '整理趨勢、動能與風險條件。', icon: Crosshair, eyebrow: 'Swing Strategy' },
  { path: '/watchlist', label: '自選股', title: '智慧自選股', description: '管理觀察清單、價格與規則提醒。', icon: Star, eyebrow: 'Watchlist' },
  { path: '/ai', label: '股寶', title: '股寶', description: '使用規則型分析回答常見市場問題。', icon: Bot, eyebrow: 'GULI Assistant' },
  { path: '/stock-snapshots', label: '個股快照', title: '上市個股快照', description: '使用官方盤後價量資料產生可追溯的規則型個股快照。', icon: ChartCandlestick, eyebrow: 'Stock Snapshots' },
  { path: '/decisions', label: '決策中心', title: 'GULI 決策中心', description: '檢視市場、產業、個股與自選股的可追溯規則決策。', icon: Radar, eyebrow: 'Decision Center' },
  stockDataStatusPage,
  { path: '/settings', label: '設定', title: '系統設定', description: '管理資料來源與平台資訊。', icon: Settings, eyebrow: 'Settings' },
]
export const allPages = [dashboardPage, ...routePages]
