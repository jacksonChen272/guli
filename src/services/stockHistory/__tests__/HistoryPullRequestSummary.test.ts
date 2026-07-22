import { describe, expect, it } from 'vitest'
import { buildHistoryPullRequestBody } from '../../../../scripts/data/history/HistoryAutomation.ts'

const coverage = { totalSecurities: 1370, eligibleCommonStocks: 1082, unsupportedSecurities: 288, complete: 121, partial: 76, pending: 885, failed: 0, technicalDataReady: 197 }
const payload = { batchDeltaBytes: 1000, totalHistoryBytes: 2000, technicalIndexBytes: 300, gitWorkingTreeDeltaBytes: 1000, largestStockFileBytes: 500, averageStockFileBytes: 400, largestStockSymbol: '2330' }

describe('history pull request summary', () => {
  it('contains coverage, validation and failure details', () => {
    const body = buildHistoryPullRequestBody({ planned: 100, success: 99, complete: 97, partial: 2, failed: 1, newRecords: 30000, totalRetries: 2, durationSeconds: 1200, coverageBefore: coverage, coverageAfter: { ...coverage, complete: 218, partial: 78, pending: 785 }, payload, auditPassed: 10, auditTotal: 10, tests: 'passed', build: 'passed', audit: 'passed', failedSymbols: ['1234'], partialDetails: [{ symbol: '5678', reason: 'new listing' }] })
    expect(body).toContain('Planned: 100')
    expect(body).toContain('121/1,082 -> 218/1,082')
    expect(body).toContain('1234')
    expect(body).toContain('5678: new listing')
  })
})
