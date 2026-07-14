import { describe, expect, it } from 'vitest'
import { marketRepository } from '../dataRepository'
import { generateWatchlistAlerts } from '../watchlistInsightService'
import type { WatchlistItem } from '../../types/stock'

const stock = marketRepository.getStock('2330')!
const item = (changes: Partial<WatchlistItem> = {}): WatchlistItem => ({ symbol: stock.symbol, groupId: 'priority', note: '', createdAt: '2026-07-10T00:00:00.000Z', ...changes })

describe('watchlistInsightService', () => {
  it('接近停損價時產生提醒', () => { const alerts = generateWatchlistAlerts([item({ stopLossPrice: stock.price * .99 })], marketRepository.getStocks()); expect(alerts.some((alert) => alert.type === '接近停損' && alert.symbol === '2330')).toBe(true) })
  it('遠離停損價時不產生接近停損提醒', () => { const alerts = generateWatchlistAlerts([item({ stopLossPrice: stock.price * .7 })], marketRepository.getStocks()); expect(alerts.some((alert) => alert.type === '接近停損')).toBe(false) })
})
