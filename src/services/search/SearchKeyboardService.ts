export type SearchKeyboardAction = 'next' | 'previous' | 'select' | 'close' | 'none'

export function getSearchKeyboardAction(key: string, shiftKey = false): SearchKeyboardAction {
  if (key === 'ArrowDown' || (key === 'Tab' && !shiftKey)) return 'next'
  if (key === 'ArrowUp' || (key === 'Tab' && shiftKey)) return 'previous'
  if (key === 'Enter') return 'select'
  if (key === 'Escape') return 'close'
  return 'none'
}

export function moveSearchSelection(current: number, action: SearchKeyboardAction, resultCount: number) {
  if (resultCount <= 0) return 0
  if (action === 'next') return (current + 1) % resultCount
  if (action === 'previous') return (current - 1 + resultCount) % resultCount
  return Math.min(Math.max(current, 0), resultCount - 1)
}
