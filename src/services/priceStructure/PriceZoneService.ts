import type { OfficialStockHistoryPrice } from '../../types/officialStockHistory'
import type { PricePivot, PriceZone, PriceZoneStrength, PriceZoneType } from '../../types/supportResistance'

export interface PriceLevelCandidate {
  price: number
  type: PriceZoneType
  source: string
  tradeDate?: string | null
}

const roundPrice = (value: number) => Number(value.toFixed(value >= 100 ? 1 : 2))

export function buildPriceZones(
  candidates: PriceLevelCandidate[],
  prices: OfficialStockHistoryPrice[],
  currentPrice: number,
  atr14: number | null,
): PriceZone[] {
  const mergeDistance = Math.max(currentPrice * 0.0075, (atr14 ?? 0) * 0.45)
  const sorted = [...candidates]
    .filter((candidate) => Number.isFinite(candidate.price) && candidate.price > 0)
    .sort((left, right) => left.price - right.price)
  const clusters: PriceLevelCandidate[][] = []
  sorted.forEach((candidate) => {
    const cluster = clusters.at(-1)
    const center = cluster ? cluster.reduce((sum, item) => sum + item.price, 0) / cluster.length : null
    if (cluster && center !== null && Math.abs(candidate.price - center) <= mergeDistance) cluster.push(candidate)
    else clusters.push([candidate])
  })

  return clusters.map((cluster, index) => {
    const centerRaw = cluster.reduce((sum, item) => sum + item.price, 0) / cluster.length
    const type: PriceZoneType = centerRaw <= currentPrice ? 'support' : 'resistance'
    const center = type === 'support' ? Math.min(centerRaw, currentPrice) : Math.max(centerRaw, currentPrice)
    const halfWidth = Math.max(currentPrice * 0.0025, (atr14 ?? currentPrice * 0.01) * 0.18)
    const touches = prices.filter((point) => {
      const values = [point.low, point.high, point.close].filter((value): value is number => value !== null)
      return values.some((value) => Math.abs(value - center) <= mergeDistance)
    })
    const touchCount = touches.length
    const sourceCount = new Set(cluster.map((item) => item.source)).size
    const strength: PriceZoneStrength = touchCount >= 4 || sourceCount >= 3 ? 'strong' : touchCount >= 2 || sourceCount >= 2 ? 'medium' : 'weak'
    return {
      id: `${type}-${index + 1}-${roundPrice(center)}`,
      type,
      lower: roundPrice(center - halfWidth),
      upper: roundPrice(center + halfWidth),
      center: roundPrice(center),
      strength,
      touchCount,
      lastTouchedAt: touches.at(-1)?.tradeDate ?? cluster.map((item) => item.tradeDate).filter(Boolean).sort().at(-1) ?? null,
      distancePercent: Number(((center / currentPrice - 1) * 100).toFixed(2)),
      sources: [...new Set(cluster.map((item) => item.source))],
    }
  }).filter((zone) => zone.type === 'support' ? zone.center <= currentPrice : zone.center >= currentPrice)
}

export function pivotsToCandidates(pivots: PricePivot[]): PriceLevelCandidate[] {
  return pivots.map((pivot) => ({ price: pivot.price, type: pivot.type === 'low' ? 'support' : 'resistance', source: pivot.type === 'low' ? '波段低點' : '波段高點', tradeDate: pivot.tradeDate }))
}
