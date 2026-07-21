import { calculateMarketSentiment, type MarketSentimentInput } from '../services/dashboard/MarketSentimentService'

export interface MarketSentimentDependencies {
  getInput: () => Promise<MarketSentimentInput>
}

export class MarketSentimentRepository {
  private cached: Awaited<ReturnType<typeof calculateMarketSentiment>> | null = null
  constructor(private readonly dependencies: MarketSentimentDependencies) {}

  async getLatest(force = false) {
    if (!force && this.cached) return this.cached
    this.cached = calculateMarketSentiment(await this.dependencies.getInput())
    return this.cached
  }

  clearCache() { this.cached = null }
}

