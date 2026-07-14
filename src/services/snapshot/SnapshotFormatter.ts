import type { MarketSnapshot, SnapshotMarketStatus, SnapshotSourceType } from '../../types/snapshot'

export const marketStatusForTemperature = (temperature: number): SnapshotMarketStatus => temperature <= 20 ? '極弱' : temperature <= 40 ? '偏弱' : temperature <= 60 ? '中性' : temperature <= 80 ? '偏強' : '極強'
export const sourceLabel = (type: SnapshotSourceType) => ({ official: '官方資料', mock: '模擬資料', derived: '規則推導', fallback: '回退資料' })[type]
export const formatTwd = (value: number | null) => value === null ? '無資料' : `${(value / 100_000_000).toLocaleString('zh-TW', { maximumFractionDigits: 0 })} 億元`
export const formatSigned = (value: number | null, suffix = '') => value === null ? '無資料' : `${value > 0 ? '+' : ''}${value.toLocaleString('zh-TW', { maximumFractionDigits: 2 })}${suffix}`
export function formatShareSummary(snapshot: MarketSnapshot) {
  const strong = snapshot.topIndustries.map((industry) => industry.name).join('、') || '無資料'
  const weak = snapshot.weakIndustries.map((industry) => industry.name).join('、') || '無資料'
  const sources = [...new Set(snapshot.sources.map((source) => sourceLabel(source.type)))].join('、')
  return `股勵 GULI｜${snapshot.tradeDate}\n市場狀態：${snapshot.marketStatus}（${snapshot.marketTemperature} 分）\n${snapshot.headline}\n強勢產業：${strong}\n弱勢產業：${weak}\n資料來源：${sources}\n本內容僅供資訊參考，不構成投資建議。`
}
