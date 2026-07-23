import type { RankedSearchResult, SearchIndexItem, SearchStockIndexItem } from '../../types/search'

export const normalizeSearchText = (value: string) => value.normalize('NFKC').trim().toLocaleLowerCase('zh-TW')

const isSubsequence = (query: string, target: string) => {
  let cursor = 0
  for (const character of target) if (character === query[cursor]) cursor += 1
  return cursor === query.length
}

const editDistance = (left: string, right: string) => {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index)
  for (let row = 1; row <= left.length; row += 1) {
    let diagonal = previous[0]
    previous[0] = row
    for (let column = 1; column <= right.length; column += 1) {
      const before = previous[column]
      previous[column] = Math.min(
        previous[column] + 1,
        previous[column - 1] + 1,
        diagonal + (left[row - 1] === right[column - 1] ? 0 : 1),
      )
      diagonal = before
    }
  }
  return previous[right.length]
}

const fuzzyMatches = (query: string, values: string[]) => values.some((value) => {
  if (!value) return false
  if (isSubsequence(query, value)) return true
  const tolerance = query.length >= 5 ? 2 : 1
  return editDistance(query, value.slice(0, Math.max(query.length, Math.min(value.length, query.length + 2)))) <= tolerance
})

export function getStockSearchPriority(stock: SearchStockIndexItem, rawQuery: string): RankedSearchResult | null {
  const query = normalizeSearchText(rawQuery)
  if (!query) return null
  const symbol = normalizeSearchText(stock.symbol)
  const name = normalizeSearchText(stock.name)
  const english = normalizeSearchText(stock.englishName ?? '')
  const industry = normalizeSearchText(stock.industry)
  if (symbol === query) return { item: stock, priority: 1, matchedBy: '股票代碼完全符合' }
  if (symbol.startsWith(query)) return { item: stock, priority: 2, matchedBy: '股票代碼開頭符合' }
  if (name.startsWith(query) || english.startsWith(query)) return { item: stock, priority: 3, matchedBy: '股票名稱開頭符合' }
  if (name.includes(query) || english.includes(query) || industry.includes(query)) return { item: stock, priority: 4, matchedBy: industry.includes(query) ? '產業符合' : '股票名稱包含' }
  if (fuzzyMatches(query, [name, english, symbol])) return { item: stock, priority: 5, matchedBy: '模糊符合' }
  return null
}

const getCommandPriority = (item: Extract<SearchIndexItem, { kind: 'command' }>, rawQuery: string): RankedSearchResult | null => {
  const query = normalizeSearchText(rawQuery)
  const values = [item.label, item.path, ...item.keywords].map(normalizeSearchText)
  if (values.some((value) => value === query)) return { item, priority: 1, matchedBy: '功能完全符合' }
  if (values.some((value) => value.startsWith(query))) return { item, priority: 3, matchedBy: '功能名稱開頭符合' }
  if (values.some((value) => value.includes(query))) return { item, priority: 4, matchedBy: '功能名稱包含' }
  if (fuzzyMatches(query, values)) return { item, priority: 5, matchedBy: '功能模糊符合' }
  return null
}

export function rankSearchCandidates(query: string, candidates: SearchIndexItem[], limit = 10): RankedSearchResult[] {
  const ranked = candidates
    .map((item) => item.kind === 'stock' ? getStockSearchPriority(item, query) : getCommandPriority(item, query))
    .filter((item): item is RankedSearchResult => item !== null)
  return ranked.sort((left, right) => {
    if (left.priority !== right.priority) return left.priority - right.priority
    if (left.item.popularityScore !== right.item.popularityScore) return right.item.popularityScore - left.item.popularityScore
    if (left.item.kind === 'stock' && right.item.kind === 'stock') return Number(right.item.symbol) - Number(left.item.symbol)
    const leftLabel = left.item.kind === 'stock' ? left.item.name : left.item.label
    const rightLabel = right.item.kind === 'stock' ? right.item.name : right.item.label
    return leftLabel.localeCompare(rightLabel, 'zh-TW')
  }).slice(0, Math.max(0, limit))
}
