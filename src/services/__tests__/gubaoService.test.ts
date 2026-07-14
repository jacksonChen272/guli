import { describe, expect, it } from 'vitest'
import { answerGubaoQuestion } from '../gubaoService'
import { marketRepository } from '../dataRepository'
import { calculateStockHealth } from '../stockHealthService'

describe('gubaoService', () => {
  it('股寶回答引用規則計算的健康分數', () => { const stock = marketRepository.getStock('2330')!; const score = calculateStockHealth(stock, marketRepository.getStocks()).totalScore; const answer = answerGubaoQuestion('2330 現在健康分數多少？', []); expect(answer).toContain(`健康分數 ${score} 分`); expect(answer).toContain('不構成投資建議') })
  it('市場回答引用市場狀態與溫度', () => { const answer = answerGubaoQuestion('今天市場偏多還是偏空？', []); expect(answer).toContain(`市場溫度 ${marketRepository.getOverview().temperature.score} 分`); expect(answer).toMatch(/偏多|偏空|偏強|偏弱|中性/) })
})
