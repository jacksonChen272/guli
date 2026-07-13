import type { InstitutionalFlow } from './market'

export interface Industry {
  id: string
  name: string
  color: string
  changePercent: number
  capitalFlow: number
  momentum: number
  cumulative20d: number
  healthScore: number
  institutions: InstitutionalFlow
  stockSymbols: string[]
}
