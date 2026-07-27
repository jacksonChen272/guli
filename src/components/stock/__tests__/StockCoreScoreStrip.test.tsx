import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const source = readFileSync(new URL('../StockCoreScoreStrip.tsx', import.meta.url), 'utf8')

describe('StockCoreScoreStrip', () => {
  it('documents independent score and risk scales', () => {
    expect(source).toContain('風險為類別量尺')
    expect(source).toContain('score.scaleLabel')
  })

  it('uses two-column mobile and five-column desktop layout', () => {
    expect(source).toContain('grid-cols-2')
    expect(source).toContain('xl:grid-cols-5')
  })

  it('renders meters only for finite numeric scores', () => {
    expect(source).toContain("score.id !== 'risk'")
    expect(source).toContain('score.value !== null')
    expect(source).toContain('role="meter"')
  })

  it('opens Decision Trace from the Decision card', () => {
    expect(source).toContain('onOpenDecisionTrace')
  })
})
