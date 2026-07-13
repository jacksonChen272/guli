import type { LucideIcon } from 'lucide-react'
import {
  Bot,
  ChartCandlestick,
  CircleDollarSign,
  Crosshair,
  Gauge,
  Radar,
  Settings,
  Star,
} from 'lucide-react'

export type PageConfig = {
  path: string
  label: string
  title: string
  description: string
  icon: LucideIcon
  eyebrow: string
}

export const dashboardPage: PageConfig = {
  path: '/', label: '總覽', title: '市場總覽', description: '快速掌握今日市場狀態', icon: Gauge, eyebrow: 'Dashboard',
}

export const routePages: PageConfig[] = [
  { path: '/capital-flow', label: '資金輪動', title: '資金輪動', description: '追蹤產業籌碼與主力資金流向', icon: CircleDollarSign, eyebrow: 'Capital Flow' },
  { path: '/market-focus', label: '市場焦點', title: '市場焦點', description: '聚焦驅動盤勢的關鍵事件與題材', icon: Radar, eyebrow: 'Market Focus' },
  { path: '/stock-analysis', label: '個股分析', title: '個股分析', description: '整合基本面、技術面與籌碼面訊號', icon: ChartCandlestick, eyebrow: 'Stock Analysis' },
  { path: '/swing-strategy', label: '波段策略', title: '波段策略', description: '建立、驗證並追蹤你的交易策略', icon: Crosshair, eyebrow: 'Swing Strategy' },
  { path: '/watchlist', label: '自選股', title: '自選股', description: '集中管理關注標的與價格提醒', icon: Star, eyebrow: 'Watchlist' },
  { path: '/ai-assistant', label: 'AI 助理', title: 'AI 投資助理', description: '用自然語言探索市場資料與投資線索', icon: Bot, eyebrow: 'GULI Intelligence' },
  { path: '/settings', label: '設定', title: '偏好設定', description: '管理帳戶、通知與顯示偏好', icon: Settings, eyebrow: 'Settings' },
]

export const allPages = [dashboardPage, ...routePages]
