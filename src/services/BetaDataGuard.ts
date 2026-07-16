import type { DataSourceKind, DataTrustReport, DataTrustStatus } from '../types/dataTrust'
export function evaluateDataTrust(sources: DataSourceKind[], stale = false): DataTrustReport {
  const unique = [...new Set(sources)]
  let status: DataTrustStatus
  if (stale) status = 'Stale'
  else if (!unique.length || unique.every((source) => source === 'missing')) status = 'Missing'
  else if (unique.includes('fallback')) status = 'Fallback'
  else if (unique.includes('official') && unique.some((source) => source === 'mock' || source === 'derived')) status = 'Mixed'
  else if (unique.includes('mock')) status = 'Mock'
  else status = 'Official'
  const message = status === 'Official' || (status === 'Mixed' && !unique.includes('mock')) ? '行情欄位來自 TWSE 官方盤後資料；分析結果為 GULI 規則推導。' : status === 'Missing' ? '部分資料尚未取得；缺值不以模擬數值填補。' : '本頁包含模擬或推導資料，僅供功能測試。'
  return { status, sources: unique, stale, message, disclaimerRequired: true }
}
export const resourceTrustSources = (resource: 'overview' | 'stocks' | 'industries' | 'events'): DataSourceKind[] => {
  const sources: Record<typeof resource, DataSourceKind[]> = { overview: ['official', 'derived', 'mock'], stocks: ['official', 'derived', 'mock'], industries: ['derived', 'mock'], events: ['mock'] }
  return sources[resource]
}
export const canPresentAsOfficial = (sources: DataSourceKind[]) => sources.length > 0 && sources.every((source) => source === 'official')
