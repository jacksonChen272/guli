import { describe, expect, it } from 'vitest'
import { getSearchKeyboardAction, moveSearchSelection } from '../SearchKeyboardService'

describe('Search keyboard navigation', () => {
  it('方向下鍵移到下一筆', () => expect(moveSearchSelection(0, getSearchKeyboardAction('ArrowDown'), 4)).toBe(1))
  it('方向上鍵可循環到最後一筆', () => expect(moveSearchSelection(0, getSearchKeyboardAction('ArrowUp'), 4)).toBe(3))
  it('Tab 切換到下一筆', () => expect(getSearchKeyboardAction('Tab')).toBe('next'))
  it('Shift+Tab 切換到上一筆', () => expect(getSearchKeyboardAction('Tab', true)).toBe('previous'))
  it('Enter 觸發開啟結果', () => expect(getSearchKeyboardAction('Enter')).toBe('select'))
  it('Escape 關閉搜尋', () => expect(getSearchKeyboardAction('Escape')).toBe('close'))
})
