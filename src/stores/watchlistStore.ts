import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type WatchlistState = {
  symbols: string[]
  add: (symbol: string) => void
  remove: (symbol: string) => void
  toggle: (symbol: string) => void
  has: (symbol: string) => boolean
}

export const useWatchlistStore = create<WatchlistState>()(persist((set, get) => ({
  symbols: ['2330', '2313', '3006'],
  add: (symbol) => set((state) => ({ symbols: state.symbols.includes(symbol) ? state.symbols : [...state.symbols, symbol] })),
  remove: (symbol) => set((state) => ({ symbols: state.symbols.filter((item) => item !== symbol) })),
  toggle: (symbol) => get().has(symbol) ? get().remove(symbol) : get().add(symbol),
  has: (symbol) => get().symbols.includes(symbol),
}), { name: 'guli-watchlist' }))
