import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarketSentimentVisual } from '../MarketSentimentVisual'

describe('MarketSentimentVisual', () => {
  const sentiment = {
    score: 68.5,
    label: '偏多',
    level: 'bullish' as const,
    interval: '60–未滿 80',
    confidence: 90,
    reason: '市場廣度為主要可用因子。',
    tradeDate: '2026-07-22',
    formulaVersion: 'market-sentiment-v1' as const,
  }

  it('renders score, interval, reason, and date', () => {
    const html = renderToStaticMarkup(<MarketSentimentVisual sentiment={sentiment} />)
    expect(html).toContain('68.5')
    expect(html).toContain('60–未滿 80')
    expect(html).toContain('市場廣度為主要可用因子')
    expect(html).toContain('2026-07-22')
  })

  it('uses an accessible meter and text label in addition to color', () => {
    const html = renderToStaticMarkup(<MarketSentimentVisual sentiment={sentiment} />)
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="68.5"')
    expect(html).toContain('偏多')
  })
})
