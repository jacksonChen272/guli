import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { spacingScale, typographyScale, uiRules } from '../../../config/uiDesignSystem'

const read = (relative: string) => readFileSync(fileURLToPath(new URL(relative, import.meta.url)), 'utf8')
const css = read('../../../styles/index.css')
const drawer = read('../Drawer.tsx')
const sidebar = read('../../layout/Sidebar.tsx')
const topBar = read('../../layout/TopBar.tsx')
const watchlistTable = read('../../watchlist/WatchlistDashboardTable.tsx')
const decisionCenter = read('../../../pages/DecisionCenter.tsx')
const stockOverview = read('../../stock/StockScoreOverview.tsx')
const gubao = read('../../ai/DecisionGubaoPanel.tsx')
const stockSnapshots = read('../../../pages/StockSnapshotOverview.tsx')
const stockDataStatus = read('../../../pages/StockDataStatus.tsx')
const marketFocus = read('../../../pages/MarketFocus.tsx')

describe('GULI UI 2.0 typography contracts', () => {
  it('定義 40px display 與 34px page title', () => expect([typographyScale.display, typographyScale.pageTitle]).toEqual([40, 34]))
  it('手機頁面標題維持 28px', () => expect(typographyScale.mobilePageTitle).toBe(28))
  it('正文桌面 16px、手機不低於 15px', () => expect([typographyScale.body, typographyScale.mobileBody]).toEqual([16, 15]))
  it('卡片標題與區塊標題符合 20px／24px', () => expect([typographyScale.cardTitle, typographyScale.sectionTitle]).toEqual([20, 24]))
  it('表格 header 14px、cell 15px', () => expect([typographyScale.tableHeader, typographyScale.tableCell]).toEqual([14, 15]))
  it('Badge 至少 13px', () => expect(typographyScale.badge).toBeGreaterThanOrEqual(13))
  it('三種 score 的數字至少 28px', () => { expect(typographyScale.metricMediumMax).toBeGreaterThanOrEqual(28); expect(stockOverview).toContain('Decision Score'); expect(stockOverview).toContain('健康分數'); expect(stockOverview).toContain('單日 Snapshot') })
  it('數字採 tabular-nums', () => expect(css).toContain('font-variant-numeric: tabular-nums'))
})

describe('GULI UI 2.0 spacing and data display contracts', () => {
  it('spacing scale 完整', () => expect([...spacingScale]).toEqual([4, 8, 12, 16, 20, 24, 32, 40, 48]))
  it('標準卡片桌面內距至少 20px', () => expect(uiRules.cardPaddingDesktopMin).toBeGreaterThanOrEqual(20))
  it('手機卡片內距至少 16px', () => expect(uiRules.cardPaddingMobileMin).toBeGreaterThanOrEqual(16))
  it('一般表格列高至少 60px', () => expect(uiRules.dataTableRowHeight).toBeGreaterThanOrEqual(60))
  it('自選股列高至少 72px', () => { expect(uiRules.watchlistRowHeight).toBeGreaterThanOrEqual(72); expect(watchlistTable).toContain('watchlist') })
  it('DataTable 有 sticky header 與 hover 狀態', () => { expect(css).toContain('position: sticky'); expect(css).toContain('.data-table tbody tr:hover') })
  it('高風險同時使用圖示與文字', () => { expect(uiRules.riskUsesTextAndIcon).toBe(true); expect(watchlistTable).toContain('AlertTriangle'); expect(watchlistTable).toContain('風險') })
})

describe('GULI UI 2.0 responsive and accessibility contracts', () => {
  it('所有觸控操作至少 44px', () => expect(uiRules.minimumTouchTarget).toBeGreaterThanOrEqual(44))
  it('股寶快速問題至少 48px', () => { expect(uiRules.quickQuestionTouchTarget).toBe(48); expect(gubao).toContain('min-h-12') })
  it('自選股手機使用卡片而非壓縮表格', () => expect(watchlistTable).toContain('mobile-data-card'))
  it('決策中心手機使用決策卡片', () => expect(decisionCenter).toContain('mobile-data-card'))
  it('個股快照排行套用 DataTable 與手機卡片', () => { expect(stockSnapshots).toContain('<DataTable'); expect(stockSnapshots).toContain('mobile-data-card') })
  it('資料狀態頁套用 DataTable 與手機卡片', () => { expect(stockDataStatus).toContain('<DataTable'); expect(stockDataStatus).toContain('mobile-data-card') })
  it('市場焦點使用響應式卡片格線', () => { expect(marketFocus).toContain('md:grid-cols-2'); expect(marketFocus).toContain('市場焦點卡片') })
  it('Drawer 標題至少 22px 且 Escape 可關閉', () => { expect(typographyScale.drawerTitle).toBeGreaterThanOrEqual(22); expect(drawer).toContain("event.key === 'Escape'"); expect(drawer).toContain('text-[22px]') })
  it('icon button 具有 aria-label', () => { expect(sidebar).toContain('aria-label='); expect(topBar).toContain('aria-label=') })
  it('支援 375px 手機寬度且主容器不強制更寬', () => { expect(uiRules.supportedMobileWidth).toBe(375); expect(css).toContain('min-width: 320px') })
  it('支援 1366px 筆電資訊層級', () => expect(uiRules.supportedLaptopWidth).toBe(1366))
  it('prefers-reduced-motion 可停用動畫', () => { expect(uiRules.reducedMotionSupported).toBe(true); expect(css).toContain('@media (prefers-reduced-motion: reduce)') })
})
