import { create } from 'zustand'
import { persist } from 'zustand/middleware'
interface BetaModeState { publicBetaMode: boolean; setPublicBetaMode: (enabled: boolean) => void }
export const useBetaModeStore = create<BetaModeState>()(persist((set) => ({ publicBetaMode: true, setPublicBetaMode: (publicBetaMode) => set({ publicBetaMode }) }), { name: 'guli-public-beta-mode' }))
