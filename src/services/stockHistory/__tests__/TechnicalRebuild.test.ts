import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('Technical Rebuild contract', () => {
  it('keeps technical-v1.0 score weights unchanged', async () => { const source = await readFile('scripts/generate-technical-index.mjs', 'utf8'); expect(source).toContain('trend: 0.30, momentum: 0.20, volume: 0.15, macd: 0.15, position: 0.10, risk: 0.10') })
  it('includes every required indicator in the existing generator', async () => { const source = await readFile('scripts/generate-technical-index.mjs', 'utf8'); for (const indicator of ['ma5', 'ma10', 'ma20', 'ma60', 'ma120', 'rsi14', 'macdSignal', 'bollingerUpper', 'atr14', 'volumeRatio', 'volatility20']) expect(source).toContain(indicator) })
})
