import type { LucideIcon } from 'lucide-react'
import { Bot, ChartCandlestick, CircleDollarSign, Crosshair, Gauge, Radar, Settings, Star } from 'lucide-react'

export type PageConfig = { path: string; label: string; title: string; description: string; icon: LucideIcon; eyebrow: string }
export const dashboardPage: PageConfig = { path: '/', label: '市場總覽', title: '台股市場總覽', description: '掌握指數、法人與產業資金輪動。', icon: Gauge, eyebrow: 'Dashboard' }
export const routePages: PageConfig[] = [
  { path: '/capital-flow', label: '資金輪動', title: '資金輪動', description: '觀察產業與個股的資金流向及動能變化。', icon: CircleDollarSign, eyebrow: 'Capital Flow' },
  { path: '/market-focus', label: '市場焦點', title: '市場焦點', description: '聚合今日產業、法人、量價與風險訊號。', icon: Radar, eyebrow: 'Market Focus' },
  { path: '/stock-analysis', label: '個股分析', title: '個股分析', description: '搜尋股票並查看規則型健康健檢。', icon: ChartCandlestick, eyebrow: 'Stock Analysis' },
  { path: '/swing-strategy', label: '波段策略', title: '波段策略', description: '整理趨勢、籌碼與風險控制條件。', icon: Crosshair, eyebrow: 'Swing Strategy' },
  { path: '/watchlist', label: '自選股', title: '智慧自選股', description: '管理群組、觀察價與智慧風險提醒。', icon: Star, eyebrow: 'Watchlist' },
  { path: '/ai', label: '股寶', title: '股寶', description: '使用固定規則回答市場與自選股問題。', icon: Bot, eyebrow: 'GULI Assistant' },
  { path: '/settings', label: '設定', title: '系統設定', description: '管理介面、資料顯示與個人偏好。', icon: Settings, eyebrow: 'Settings' },
]
export const allPages = [dashboardPage, ...routePages]
