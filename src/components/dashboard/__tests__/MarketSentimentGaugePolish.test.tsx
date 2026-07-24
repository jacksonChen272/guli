import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MarketSentimentVisual } from '../MarketSentimentVisual'

const sentiment = {
  score: 72.4,
  label: '偏多',
  level: 'bullish' as const,
  interval: '60–80',
  confidence: 88,
  reason: '市場廣度與外資方向支持偏多判讀。',
  tradeDate: '2026-07-23',
  formulaVersion: 'market-sentiment-v1' as const,
}

describe('MarketSentimentVisual polish', () => {
  it('renders an accessible semicircle gauge with a numeric value', () => {
    const html = renderToStaticMarkup(<MarketSentimentVisual sentiment={sentiment} />)
    expect(html).toContain('role="meter"')
    expect(html).toContain('aria-valuenow="72.4"')
    expect(html).toContain('M 20 108 A 90 90 0 0 1 200 108')
    expect(html).toContain('72.4')
  })

  it('uses SVG only and does not add another chart dependency', () => {
    const html = renderToStaticMarkup(<MarketSentimentVisual sentiment={sentiment} />)
    expect(html).toContain('<svg')
    expect(html).not.toContain('echarts')
    expect(html).not.toContain('canvas')
  })

  it('communicates the state using text in addition to color', () => {
    const html = renderToStaticMarkup(<MarketSentimentVisual sentiment={sentiment} />)
    expect(html).toContain('偏多')
    expect(html).toContain('市場情緒')
    expect(html).toContain('滿分 100')
    expect(html).toContain('市場廣度與外資方向支持偏多判讀')
  })

  it('never renders null, undefined, or NaN for missing sentiment', () => {
    const html = renderToStaticMarkup(<MarketSentimentVisual sentiment={{ ...sentiment, score: null, label: '資料不足' }} />)
    expect(html).toContain('尚未取得')
    expect(html).not.toMatch(/undefined|NaN|null/)
  })
})
