import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { decisionEngine } from '../decision/DecisionEngine'
import { stockSnapshot } from '../decision/__tests__/decisionTestFixtures'
import { canPresentAsOfficial, evaluateDataTrust } from '../BetaDataGuard'
import { calculateDataCoverage } from '../DataCoverageService'
import type { OfficialStockInstitutionalRecord } from '../../types/officialInstitutionalData'
const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
describe('Beta Data Guard, data coverage and Decision provenance', () => {
  it('全為 official 顯示 Official', () => expect(evaluateDataTrust(['official']).status).toBe('Official'))
  it('official + derived 顯示 Mixed', () => expect(evaluateDataTrust(['official', 'derived']).status).toBe('Mixed'))
  it('含 Mock 顯示 Mixed 並出現測試警語', () => { const report = evaluateDataTrust(['official', 'mock']); expect(report.status).toBe('Mixed'); expect(report.message).toContain('功能測試') })
  it('只有 Mock 顯示 Mock', () => expect(evaluateDataTrust(['mock']).status).toBe('Mock'))
  it('Fallback 優先顯示 Fallback', () => expect(evaluateDataTrust(['official', 'fallback']).status).toBe('Fallback'))
  it('stale 優先顯示 Stale', () => expect(evaluateDataTrust(['official'], true).status).toBe('Stale'))
  it('空來源顯示 Missing', () => expect(evaluateDataTrust([]).status).toBe('Missing'))
  it('Mock 不可呈現為 Official', () => expect(canPresentAsOfficial(['official', 'mock'])).toBe(false))
  it('官方覆蓋率依筆數計算且封頂 100', () => { const report = calculateDataCoverage({ marketAvailable: true, stockRecords: 120, targetStocks: 100, institutionalRecords: 50, institutionalTarget: 100, industryOfficialRecords: 0, industryTarget: 12, historyDays: 3, updatedAt: null, stale: false }); expect(report.marketOfficialPercent).toBe(100); expect(report.stockOfficialPercent).toBe(100); expect(report.institutionalOfficialPercent).toBe(50); expect(report.industryOfficialPercent).toBe(0) })
  it('覆蓋率列出衍生門檻統計', () => expect(calculateDataCoverage({ marketAvailable: false, stockRecords: 0, targetStocks: 1, institutionalRecords: 0, institutionalTarget: 1, industryOfficialRecords: 0, industryTarget: 1, historyDays: -1, updatedAt: null, stale: true }).derivedFields.join(' ')).toContain('9.5%'))
  it('公開測試模式預設啟用', () => expect(source('../../stores/betaModeStore.ts')).toContain('publicBetaMode: true'))
  it('Settings 提供公開測試模式開關與覆蓋率入口', () => { const settings = source('../../pages/Settings.tsx'); expect(settings).toContain('公開測試模式'); expect(settings).toContain("navigate('/data-coverage')") })
  it('App 註冊 data-coverage 路由且維持單一路由', () => { const app = source('../../App.tsx'); expect(app.match(/path="\/data-coverage"/g)).toHaveLength(1); expect(source('../../../vite.config.ts')).toContain("base: '/guli/'") })
  it('Dashboard 法人元件不直接 fetch', () => { const component = source('../../components/dashboard/InstitutionalOverview.tsx'); expect(component).toContain('repositoryHub.institutions'); expect(component).not.toContain('fetch(') })
  it('個股法人區缺值不以 Mock 補值', () => { const component = source('../../components/stock/StockInstitutionalPanel.tsx'); expect(component).toContain('官方法人資料尚未取得'); expect(component).toContain('缺值不以 Mock 數值填補') })
  it('Decision Score 在附加官方法人 Trace 前後相同', () => { const snapshot = stockSnapshot(); const institutional: OfficialStockInstitutionalRecord = { symbol: snapshot.symbol, name: snapshot.name, foreignNetShares: 100, trustNetShares: 20, dealerNetShares: -10, totalNetShares: 110, tradeDate: snapshot.tradeDate, source: 'TWSE', fetchedAt: '2026-07-16T08:00:00Z', status: 'official', warnings: [] }; const without = decisionEngine.stock(snapshot, null, null, null, null); const withOfficial = decisionEngine.stock(snapshot, null, null, null, institutional); expect(withOfficial.score).toBe(without.score) })
  it('Decision Trace 附加 TWSE 法人來源', () => { const snapshot = stockSnapshot(); const institutional: OfficialStockInstitutionalRecord = { symbol: snapshot.symbol, name: snapshot.name, foreignNetShares: 100, trustNetShares: 20, dealerNetShares: -10, totalNetShares: 110, tradeDate: snapshot.tradeDate, source: 'TWSE', fetchedAt: '2026-07-16T08:00:00Z', status: 'official', warnings: [] }; const result = decisionEngine.stock(snapshot, null, null, null, institutional); expect(result.sources.find((item) => item.id === 'twse-institutional')?.type).toBe('official'); expect(result.warnings.join(' ')).toContain('權重與分數公式維持不變') })
  it('法人缺失時 Decision Trace 明示 Missing', () => expect(decisionEngine.stock(stockSnapshot(), null, null, null, null).sources.find((item) => item.id === 'institutional-missing')?.type).toBe('missing'))
})
