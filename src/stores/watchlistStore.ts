import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { WatchlistGroup, WatchlistItem } from '../types/stock'

type WatchlistState = {
  groups: WatchlistGroup[]
  items: WatchlistItem[]
  add: (symbol: string, groupId?: string) => void
  remove: (symbol: string) => void
  edit: (symbol: string, changes: Partial<Omit<WatchlistItem, 'symbol' | 'createdAt'>>) => void
  moveToGroup: (symbol: string, groupId: string) => void
  addGroup: (name: string) => string
  toggle: (symbol: string) => void
  has: (symbol: string) => boolean
}

const groups: WatchlistGroup[] = [
  { id: 'priority', name: '重點觀察' },
  { id: 'swing', name: '波段持有' },
  { id: 'waiting', name: '等待進場' },
]

const makeItem = (symbol: string, groupId = 'priority', index = 0): WatchlistItem => ({
  symbol, groupId, note: index === 0 ? '核心權值，觀察法人連續性' : '',
  targetPrice: symbol === '2330' ? 1050 : symbol === '2313' ? 80 : symbol === '3006' ? 88 : undefined,
  stopLossPrice: symbol === '2330' ? 1010 : symbol === '2313' ? 76 : symbol === '3006' ? 83 : undefined,
  takeProfitPrice: symbol === '2330' ? 1160 : symbol === '2313' ? 90 : symbol === '3006' ? 99 : undefined,
  createdAt: `2026-07-${String(8 + index).padStart(2, '0')}T09:00:00.000Z`,
})

const initialItems = ['2330', '2313', '3006'].map((symbol, index) => makeItem(symbol, index === 1 ? 'swing' : index === 2 ? 'waiting' : 'priority', index))

export const useWatchlistStore = create<WatchlistState>()(persist((set, get) => ({
  groups,
  items: initialItems,
  add: (symbol, groupId = 'priority') => set((state) => state.items.some((item) => item.symbol === symbol) ? state : { items: [...state.items, makeItem(symbol, groupId)], groups: state.groups }),
  remove: (symbol) => set((state) => ({ items: state.items.filter((item) => item.symbol !== symbol), groups: state.groups })),
  edit: (symbol, changes) => set((state) => ({ items: state.items.map((item) => item.symbol === symbol ? { ...item, ...changes } : item), groups: state.groups })),
  moveToGroup: (symbol, groupId) => get().edit(symbol, { groupId }),
  addGroup: (name) => {
    const id = `group-${name.trim().toLowerCase().replace(/\s+/g, '-')}-${get().groups.length + 1}`
    if (name.trim() && !get().groups.some((group) => group.name === name.trim())) set((state) => ({ groups: [...state.groups, { id, name: name.trim() }], items: state.items }))
    return id
  },
  toggle: (symbol) => get().has(symbol) ? get().remove(symbol) : get().add(symbol),
  has: (symbol) => get().items.some((item) => item.symbol === symbol),
}), {
  name: 'guli-watchlist',
  version: 2,
  migrate: (persisted, version) => {
    const old = persisted as Partial<WatchlistState> & { symbols?: string[] }
    if (version < 2) return { groups, items: (old.symbols?.length ? old.symbols : ['2330', '2313', '3006']).map((symbol, index) => makeItem(symbol, 'priority', index)) }
    return persisted as WatchlistState
  },
  partialize: (state) => ({ groups: state.groups, items: state.items }),
}))
